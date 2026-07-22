import type { PlanTier } from "@prisma/client";

export const PLAN_PRICES_USD: Record<PlanTier, number> = {
  STARTER: 9,
  PRO: 19,
  AGENCY: 49,
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

export const PLAN_SCAN_SCHEDULING = {
  STARTER: "Manual scans only — run audits on demand from your dashboard",
  PRO: "Automated daily, weekly, or monthly scans per site",
  AGENCY: "Automated daily, weekly, or monthly scans per site",
} as const;

export const PLAN_SCAN_FREQUENCIES = ["Daily", "Weekly", "Monthly"] as const;

export const PLAN_UPTIME_INTERVALS = {
  STARTER: "15-minute and hourly checks",
  PRO: "5-minute checks (and slower)",
  AGENCY: "1-minute checks (and slower)",
} as const;

export function formatPlanTier(plan: PlanTier | null | undefined) {
  if (!plan) return "No plan";
  return PLAN_LABELS[plan];
}
