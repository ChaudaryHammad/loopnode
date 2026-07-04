import type { PlanTier } from "@prisma/client";

export const PLAN_PRICES_USD: Record<PlanTier, number> = {
  STARTER: 19,
  PRO: 49,
  AGENCY: 129,
};

export const PLAN_SITE_LIMITS: Record<PlanTier, number> = {
  STARTER: 3,
  PRO: 15,
  AGENCY: 50,
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  AGENCY: "Agency",
};

export const TRIAL_SITE_LIMIT = PLAN_SITE_LIMITS.STARTER;

export function formatPlanTier(plan: PlanTier | null | undefined) {
  if (!plan) return "No plan";
  return PLAN_LABELS[plan];
}
