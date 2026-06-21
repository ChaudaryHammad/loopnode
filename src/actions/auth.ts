"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import { resend } from "@/lib/resend";


// Generate a random token for emails
function generateToken() {
  // Simple random token generator since we run in Node
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function loginAction(values: any) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid form input." };
  }

  const { email, password } = parsed.data;

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

  const { name, email, password } = parsed.data;

  try {
    // Check if user already exists (including soft-deleted)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        return { success: false, error: "This email belongs to a deleted account. Contact support." };
      }
      return { success: false, error: "An account with this email already exists." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        hashedPassword,
        role: "USER",
      },
    });

    // Create verification token
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        description: `User account created for ${email}`,
      },
    });

await resend.emails.send({
  from: "LoopNode <[EMAIL_ADDRESS]>",
  to: email,
  subject: "Verify your email",
  html: `
    <p>Click to verify:</p>
    <a href="http://localhost:3000/verify-email?token=${token}">
      Verify Email
    </a>
  `,
});
    return { 
      success: true, 
      message: "Account created successfully! Please check your email to verify your account." 
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

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });

    if (!user) {
      // Return success even if email is not found to prevent user enumeration
      return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
    }

    // Generate password reset token
    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expires,
      },
    });

   await resend.emails.send({
      from: "Your App <onboarding@resend.dev>", // change later to verified domain
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial; line-height: 1.5">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Click the button below to continue:</p>

          <a 
            href="http://localhost:3000/reset-password?token=${token}" 
            style="
              display:inline-block;
              padding:10px 15px;
              background:#000;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Reset Password
          </a>

          <p style="margin-top:20px; font-size:12px; color:#666">
            This link expires in 1 hour.
          </p>
        </div>
      `,
    });

    return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
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
    // Find token
    const dbToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!dbToken || dbToken.expires < new Date()) {
      return { success: false, error: "Reset token is invalid or has expired." };
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: dbToken.email,
        deletedAt: null,
      },
    });

    if (!user) {
      return { success: false, error: "No active user account found for this reset request." };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    // Delete token after use
    await prisma.passwordResetToken.delete({
      where: { id: dbToken.id },
    });

    // Log success
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        description: `Password reset completed for ${dbToken.email}`,
      },
    });

    console.log(`[MOCK EMAIL: PASSWORD_RESET_SUCCESS] Password reset confirmation email sent to ${dbToken.email}`);

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

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: dbToken.email,
        deletedAt: null,
      },
    });

    if (!user) {
      return { success: false, error: "No active user account found for this verification request." };
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete token
    await prisma.emailVerificationToken.delete({
      where: { id: dbToken.id },
    });

    // Log success
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
