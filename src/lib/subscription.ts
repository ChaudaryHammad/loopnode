import { prisma } from "@/lib/prisma";
import { PLAN_SITE_LIMITS, TRIAL_SITE_LIMIT } from "@/lib/plans";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

const TRIAL_DAYS = 14;

export function getTrialEndDate(from = new Date()) {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export async function createTrialSubscription(userId: string) {
  return prisma.subscription.create({
    data: {
      userId,
      status: "TRIALING",
      plan: "STARTER",
      trialEndsAt: getTrialEndDate(),
    },
  });
}

export async function ensureTrialSubscription(userId: string) {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (existing) return existing;
  return createTrialSubscription(userId);
}

export async function getSubscriptionForUser(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export function getWebsiteLimitForSubscription(
  status: SubscriptionStatus,
  plan: PlanTier | null
) {
  if (plan) return PLAN_SITE_LIMITS[plan];
  if (status === "TRIALING") return TRIAL_SITE_LIMIT;
  return TRIAL_SITE_LIMIT;
}
