import { prisma } from "@/lib/prisma";
import { PLAN_LABELS, PLAN_SITE_LIMITS, TRIAL_SITE_LIMIT } from "@/lib/plans";
import { countActiveWebsites } from "@/lib/website-slots";
import { PLAN_MIN_UPTIME_INTERVAL } from "@/lib/uptime/constants";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

export interface UserEntitlements {
  plan: PlanTier | null;
  planLabel: string;
  status: SubscriptionStatus;
  websiteLimit: number;
  websiteCount: number;
  websitesRemaining: number;
  canAddWebsite: boolean;
  canScan: boolean;
  canScheduleScans: boolean;
  canGenerateReports: boolean;
  canUseMonitoring: boolean;
  minUptimeIntervalSeconds: number;
  isTrial: boolean;
  isReadOnly: boolean;
  trialEndsAt: Date | null;
  accountMessage: string | null;
}

function baseWebsiteLimit(
  status: SubscriptionStatus,
  plan: PlanTier | null,
  override: number | null | undefined
): number {
  if (override != null && override > 0) return override;
  if (plan) return PLAN_SITE_LIMITS[plan];
  if (status === "TRIALING") return TRIAL_SITE_LIMIT;
  return TRIAL_SITE_LIMIT;
}

function resolvePlanLabel(
  plan: PlanTier | null,
  isTrial: boolean
): string {
  if (plan) {
    return isTrial ? `${PLAN_LABELS[plan]} (Trial)` : PLAN_LABELS[plan];
  }
  return isTrial ? "Trial (Starter)" : "No plan";
}

export function getWebsiteLimitFromSubscription(sub: {
  status: SubscriptionStatus;
  plan: PlanTier | null;
  websiteLimitOverride?: number | null;
}): number {
  return baseWebsiteLimit(sub.status, sub.plan, sub.websiteLimitOverride);
}

export async function getEntitlements(userId: string): Promise<UserEntitlements> {
  const [subscription, websiteCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    countActiveWebsites(userId),
  ]);

  const status = subscription?.status ?? "TRIALING";
  const plan = subscription?.plan ?? null;
  const trialEndsAt = subscription?.trialEndsAt ?? null;

  const isTrial = status === "TRIALING";
  const trialExpired =
    isTrial && trialEndsAt != null && trialEndsAt.getTime() < Date.now();
  const isReadOnly =
    status === "EXPIRED" ||
    status === "CANCELLED" ||
    trialExpired ||
    status === "PAST_DUE";

  const websiteLimit = subscription
    ? getWebsiteLimitFromSubscription(subscription)
    : TRIAL_SITE_LIMIT;

  const canScan = !isReadOnly;
  const canScheduleScans =
    !isReadOnly && (plan === "PRO" || plan === "AGENCY");
  const canGenerateReports =
    !isReadOnly && (plan === "PRO" || plan === "AGENCY");
  const canUseMonitoring = !isReadOnly;
  const minUptimeIntervalSeconds =
    plan === "AGENCY"
      ? PLAN_MIN_UPTIME_INTERVAL.AGENCY
      : plan === "PRO"
        ? PLAN_MIN_UPTIME_INTERVAL.PRO
        : PLAN_MIN_UPTIME_INTERVAL.STARTER;
  const websitesRemaining = Math.max(0, websiteLimit - websiteCount);

  return {
    plan,
    planLabel: resolvePlanLabel(plan, isTrial),
    status,
    websiteLimit,
    websiteCount,
    websitesRemaining,
    canAddWebsite: !isReadOnly && websiteCount < websiteLimit,
    canScan,
    canScheduleScans,
    canGenerateReports,
    canUseMonitoring,
    minUptimeIntervalSeconds,
    isTrial,
    isReadOnly,
    trialEndsAt,
    accountMessage: subscription?.adminNotes?.trim() || null,
  };
}
