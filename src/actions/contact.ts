"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export async function submitContactForm(values: any) {
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, subject, message } = parsed.data;

  try {
    // Log contact form details (mock system support dispatch for Phase 1-2)
    console.log(`[CONTACT FORM SUBMIT] Name: ${name}, Email: ${email}, Subject: ${subject}`);
    console.log(`[CONTACT FORM MESSAGE] ${message}`);

    // In a real production system, we would trigger a Resend email to support:
    // resend.emails.send({ from: 'support@whm.dev', to: 'support@whm.dev', subject, html: ... })

    return { 
      success: true, 
      message: "Thank you for contacting us! Our support team will get back to you shortly." 
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}
