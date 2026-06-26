"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email/send-email";
import { getSupportEmail } from "@/lib/email/config";
import { prisma } from "@/lib/prisma";
import {
  renderContactConfirmationEmail,
  renderContactSupportEmail,
} from "@/lib/email/templates";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  recaptchaToken: z.string().min(1, "reCAPTCHA token is missing."),
});

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY is not set");
    return { success: false };
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
  });

  const data = await response.json();
  return { success: data.success === true, score: data.score };
}

export async function submitContactForm(values: unknown) {
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, subject, message, recaptchaToken } = parsed.data;

  // Verify reCAPTCHA token server-side
  const captchaResult = await verifyRecaptcha(recaptchaToken);
  if (!captchaResult.success) {
    return { success: false, error: "reCAPTCHA verification failed. Please try again." };
  }
  // Reject likely bots (score < 0.5 on a 0.0–1.0 scale)
  if (captchaResult.score !== undefined && captchaResult.score < 0.5) {
    return { success: false, error: "Your request was flagged as suspicious. Please try again." };
  }

  try {
    const supportEmail = getSupportEmail();

    const supportMail = renderContactSupportEmail({ name, email, subject, message });
    await sendEmail({
      to: supportEmail,
      subject: supportMail.subject,
      html: supportMail.html,
      replyTo: email,
    });

    const confirmationMail = renderContactConfirmationEmail({ name });
    await sendEmail({
      to: email,
      subject: confirmationMail.subject,
      html: confirmationMail.html,
    });

    await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    return {
      success: true,
      message: "Thank you for contacting us! Our support team will get back to you shortly.",
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}
