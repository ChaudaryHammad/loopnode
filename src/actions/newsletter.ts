"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export async function subscribeToNewsletter(email: string) {
  const parsed = subscribeSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const activeSubscriber = await prisma.newsletterSubscriber.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (activeSubscriber) {
      if (activeSubscriber.unsubscribedAt === null) {
        return { success: true, message: "You are already subscribed!" };
      }

      // Resubscribe if unsubscribed
      await prisma.newsletterSubscriber.update({
        where: { id: activeSubscriber.id },
        data: { unsubscribedAt: null, subscribedAt: new Date() },
      });
      return { success: true, message: "Welcome back! Subscribed successfully." };
    }

    // New subscription
    await prisma.newsletterSubscriber.create({
      data: {
        email: email.toLowerCase(),
      },
    });

    return { success: true, message: "Thank you for subscribing!" };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return { success: false, error: "Something went wrong. Please try again later." };
  }
}
