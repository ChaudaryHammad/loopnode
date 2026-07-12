/** Plan-gated uptime check intervals (seconds). Industry defaults: 1m / 5m / 15m / 1h. */
export const UPTIME_INTERVAL_OPTIONS = [
  { seconds: 60, label: "Every 1 minute", minPlan: "AGENCY" as const },
  { seconds: 300, label: "Every 5 minutes", minPlan: "PRO" as const },
  { seconds: 900, label: "Every 15 minutes", minPlan: "STARTER" as const },
  { seconds: 3600, label: "Every hour", minPlan: "STARTER" as const },
] as const;

export type UptimeIntervalSeconds = (typeof UPTIME_INTERVAL_OPTIONS)[number]["seconds"];

export const DEFAULT_UPTIME_INTERVAL_SECONDS = 900;
export const UPTIME_CHECK_TIMEOUT_MS = 10_000;
export const UPTIME_DEFAULT_FAILURE_THRESHOLD = 2;
export const UPTIME_CHECK_RETENTION_DAYS = 90;
export const UPTIME_CRON_BATCH_SIZE = 40;
export const UPTIME_SSL_RECHECK_HOURS = 24;

export const PLAN_MIN_UPTIME_INTERVAL: Record<"STARTER" | "PRO" | "AGENCY" | "TRIAL", number> = {
  TRIAL: 900,
  STARTER: 900,
  PRO: 300,
  AGENCY: 60,
};
