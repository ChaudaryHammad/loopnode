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

export const PLAN_REPORT_GENERATION = {
  STARTER: "Dashboard audits only — PDF & CSV exports require Pro or Agency",
  PRO: "PDF & CSV report generation and shareable links",
  AGENCY: "PDF & CSV report generation and shareable links",
} as const;

export const PLAN_SCAN_FREQUENCIES = ["Daily", "Weekly", "Monthly"] as const;

export const PLAN_UPTIME_INTERVALS = {
  STARTER: "15-minute and hourly checks",
  PRO: "5-minute checks (and slower)",
  AGENCY: "1-minute checks (and slower)",
} as const;

/**
 * Marketing bullets must match enforced entitlements only
 * (site caps, scan scheduling, uptime intervals). Audit feature
 * access is the same across plans; history is not plan-gated.
 */
export const PLAN_MARKETING_FEATURES: Record<PlanTier, readonly string[]> = {
  STARTER: [
    `Up to ${PLAN_SITE_LIMITS.STARTER} websites`,
    PLAN_UPTIME_INTERVALS.STARTER,
    PLAN_SCAN_SCHEDULING.STARTER,
    PLAN_REPORT_GENERATION.STARTER,
    "Performance, accessibility, SEO & security audits",
    "Coverage scanner",
    "Uptime & SSL monitoring",
  ],
  PRO: [
    `Up to ${PLAN_SITE_LIMITS.PRO} websites`,
    PLAN_UPTIME_INTERVALS.PRO,
    PLAN_SCAN_SCHEDULING.PRO,
    PLAN_REPORT_GENERATION.PRO,
    "Performance, accessibility, SEO & security audits",
    "Coverage scanner",
    "Uptime & SSL monitoring",
  ],
  AGENCY: [
    `Up to ${PLAN_SITE_LIMITS.AGENCY} websites`,
    PLAN_UPTIME_INTERVALS.AGENCY,
    PLAN_SCAN_SCHEDULING.AGENCY,
    PLAN_REPORT_GENERATION.AGENCY,
    "Performance, accessibility, SEO & security audits",
    "Coverage scanner",
    "Uptime & SSL monitoring",
    "Priority support",
  ],
};

export function formatPlanTier(plan: PlanTier | null | undefined) {
  if (!plan) return "No plan";
  return PLAN_LABELS[plan];
}
