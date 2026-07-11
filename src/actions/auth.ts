"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTrialSubscription } from "@/lib/subscription";
import bcrypt from "bcryptjs";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import { sendEmail, EmailSendError } from "@/lib/email/send-email";
import { getAppUrl } from "@/lib/email/config";
import { generateSecureToken } from "@/lib/email/tokens";
import {
  renderVerifyEmailEmail,
  renderPasswordResetEmail,
  renderPasswordResetSuccessEmail,
} from "@/lib/email/templates";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { captureSignupLocation } from "@/lib/user-location";

export async function loginAction(values: any) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid form input." };
  }

  const { email, password, recaptchaToken } = parsed.data;

  const captchaResult = await verifyRecaptcha(recaptchaToken ?? "");
  if (!captchaResult.success) {
    return { success: false, error: "reCAPTCHA verification failed. Please try again." };
  }
  if (captchaResult.score !== undefined && captchaResult.score < 0.5) {
    return { success: false, error: "Your request was flagged as suspicious." };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "An authentication error occurred. Please try again." };
      }
    }
    throw error;
  }
}

export async function registerAction(values: any) {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid form input." };
  }

  const { name, email, password, recaptchaToken } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const captchaResult = await verifyRecaptcha(recaptchaToken ?? "");
  if (!captchaResult.success) {
    return { success: false, error: "reCAPTCHA verification failed. Please try again." };
  }
  if (captchaResult.score !== undefined && captchaResult.score < 0.5) {
    return { success: false, error: "Your request was flagged as suspicious." };
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        return { success: false, error: "This email belongs to a deleted account. Contact support." };
      }
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        role: "USER",
      },
    });

    await createTrialSubscription(user.id);

    await captureSignupLocation(user.id).catch((error) => {
      console.error("Failed to capture signup location:", error);
    });

    const token = generateSecureToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        description: `User account created for ${normalizedEmail}`,
      },
    });

    const verifyUrl = `${getAppUrl()}/verify-email?token=${token}`;
    const { subject, html } = renderVerifyEmailEmail({ name: name ?? "", verifyUrl });

    try {
      await sendEmail({
        to: normalizedEmail,
        subject,
        html,
      });
    } catch (emailError) {
      await prisma.emailVerificationToken.deleteMany({ where: { email: normalizedEmail } });
      await prisma.activityLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });

      if (emailError instanceof EmailSendError) {
        return {
          success: false,
          error:
            "We couldn't send the verification email. Check your SMTP settings in .env.local and try again.",
        };
      }
      throw emailError;
    }

    return {
      success: true,
      message: "Account created successfully! Please check your email to verify your account.",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Internal server error during registration." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(values: any) {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid email address." };
  }

  const { email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (!user) {
      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      };
    }

    const token = generateSecureToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
    const { subject, html } = renderPasswordResetEmail({ resetUrl });

    await sendEmail({
      to: normalizedEmail,
      subject,
      html,
    });

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, error: "Failed to process forgot password request." };
  }
}

export async function resetPasswordAction(token: string, values: any) {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid form input." };
  }

  const { password } = parsed.data;

  try {
    const dbToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!dbToken || dbToken.expires < new Date()) {
      return { success: false, error: "Reset token is invalid or has expired." };
    }

    const user = await prisma.user.findFirst({
      where: {
        email: dbToken.email,
        deletedAt: null,
      },
    });

    if (!user) {
      return { success: false, error: "No active user account found for this reset request." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: dbToken.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        description: `Password reset completed for ${dbToken.email}`,
      },
    });

    const loginUrl = `${getAppUrl()}/login`;
    const { subject, html } = renderPasswordResetSuccessEmail({ loginUrl });

    await sendEmail({
      to: dbToken.email,
      subject,
      html,
    });

    return { success: true, message: "Password reset successful! You can now log in." };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Failed to reset password." };
  }
}

export async function verifyEmailAction(token: string) {
  try {
    const dbToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!dbToken || dbToken.expires < new Date()) {
      return { success: false, error: "Verification token is invalid or has expired." };
    }

    const user = await prisma.user.findFirst({
      where: {
        email: dbToken.email,
        deletedAt: null,
      },
    });

    if (!user) {
      return { success: false, error: "No active user account found for this verification request." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerificationToken.delete({
      where: { id: dbToken.id },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFIED",
        description: `Email verified for ${dbToken.email}`,
      },
    });

    return { success: true, message: "Email verified successfully! You can now log in." };
  } catch (error) {
    console.error("Verify email error:", error);
    return { success: false, error: "Failed to verify email." };
  }
}
