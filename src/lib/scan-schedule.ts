import { ScanFrequency } from "@prisma/client";

export interface ScanScheduleInput {
  frequency: ScanFrequency;
  timezone?: string;
  timeOfDay?: string;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
}

function parseTimeOfDay(value: string): { hours: number; minutes: number } {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return { hours: 9, minutes: 0 };
  }
  return {
    hours: Math.min(23, Math.max(0, hours)),
    minutes: Math.min(59, Math.max(0, minutes)),
  };
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekdayLabel = parts.find((part) => part.type === "weekday")?.value ?? "Mon";

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour"),
    minute: lookup("minute"),
    dayOfWeek: weekdayMap[weekdayLabel] ?? 1,
  };
}

function zonedLocalToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string
): Date {
  const guess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
  );

  const asZoned = getZonedDateParts(guess, timeZone);
  const desiredMinutes = parts.hour * 60 + parts.minute;
  const actualMinutes = asZoned.hour * 60 + asZoned.minute;
  const dayOffset =
    parts.year !== asZoned.year || parts.month !== asZoned.month || parts.day !== asZoned.day
      ? parts.day > asZoned.day
        ? 1
        : -1
      : 0;

  const offsetMinutes = dayOffset * 24 * 60 + (actualMinutes - desiredMinutes);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

export function computeNextScanAt(
  input: ScanScheduleInput,
  from: Date = new Date()
): Date | null {
  if (input.frequency === ScanFrequency.MANUAL) {
    return null;
  }

  const timezone = input.timezone?.trim() || "UTC";
  const { hours, minutes } = parseTimeOfDay(input.timeOfDay ?? "09:00");
  const nowParts = getZonedDateParts(from, timezone);

  let target = {
    year: nowParts.year,
    month: nowParts.month,
    day: nowParts.day,
    hour: hours,
    minute: minutes,
  };

  if (input.frequency === ScanFrequency.WEEKLY) {
    const desiredDay = input.dayOfWeek ?? 1;
    const delta = (desiredDay - nowParts.dayOfWeek + 7) % 7;
    target.day += delta;
  }

  if (input.frequency === ScanFrequency.MONTHLY) {
    const desiredDay = Math.min(28, Math.max(1, input.dayOfMonth ?? 1));
    target.day = desiredDay;
    if (desiredDay < nowParts.day) {
      target.month += 1;
      if (target.month > 12) {
        target.month = 1;
        target.year += 1;
      }
    }
  }

  let candidate = zonedLocalToUtc(target, timezone);

  if (candidate <= from) {
    if (input.frequency === ScanFrequency.DAILY) {
      target.day += 1;
    } else if (input.frequency === ScanFrequency.WEEKLY) {
      target.day += 7;
    } else if (input.frequency === ScanFrequency.MONTHLY) {
      target.month += 1;
      if (target.month > 12) {
        target.month = 1;
        target.year += 1;
      }
    }
    candidate = zonedLocalToUtc(target, timezone);
  }

  return candidate;
}

export function formatTimezoneLabel(timezone: string): string {
  return timezone.replace(/_/g, " ");
}

export function formatNextScanAt(date: Date | null | undefined, timezone = "UTC"): string | null {
  if (!date) return null;

  const formatted = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${formatted} · ${formatTimezoneLabel(timezone)}`;
}

export function formatNextScanCountdown(
  target: Date,
  now: Date = new Date(),
  options: { compact?: boolean } = {}
): string {
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return options.compact ? "Due now" : "Due now";
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (options.compact) {
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return "<1m";
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} min`);
  }

  return `in ${parts.slice(0, 2).join(" ")}`;
}

export type NextScanScheduleState =
  | "running"
  | "overdue"
  | "starting_soon"
  | "within_hour"
  | "scheduled";

const STARTING_SOON_MS = 2 * 60_000;
const OVERDUE_GRACE_MS = 2 * 60_000;
const WITHIN_HOUR_MS = 60 * 60_000;

export function getNextScanScheduleState(
  target: Date,
  now: Date = new Date(),
  options: { isAuditRunning?: boolean } = {}
): NextScanScheduleState {
  if (options.isAuditRunning) {
    return "running";
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= -OVERDUE_GRACE_MS) {
    return "overdue";
  }

  if (diffMs <= STARTING_SOON_MS) {
    return "starting_soon";
  }

  if (diffMs <= WITHIN_HOUR_MS) {
    return "within_hour";
  }

  return "scheduled";
}

export function getNextScanTickIntervalMs(state: NextScanScheduleState): number {
  if (state === "running") {
    return 30_000;
  }
  if (state === "starting_soon" || state === "within_hour") {
    return 1_000;
  }
  return 60_000;
}

function formatCountdownWithSeconds(diffMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}

function formatNextScanShortTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export interface NextScanScheduleDisplay {
  state: NextScanScheduleState;
  primary: string;
  secondary: string | null;
  title: string;
  pulse: boolean;
}

export function getNextScanScheduleDisplay(
  target: Date,
  timezone: string,
  now: Date = new Date(),
  options: { isAuditRunning?: boolean } = {}
): NextScanScheduleDisplay {
  const state = getNextScanScheduleState(target, now, options);
  const formatted = formatNextScanAt(target, timezone);
  const shortTime = formatNextScanShortTime(target, timezone);
  const diffMs = target.getTime() - now.getTime();
  const title = formatted ?? shortTime;

  if (state === "running") {
    return {
      state,
      primary: "Audit in progress",
      secondary: "Scheduled run paused until this audit finishes",
      title,
      pulse: false,
    };
  }

  if (state === "overdue") {
    return {
      state,
      primary: "Queued — starting shortly",
      secondary: shortTime,
      title,
      pulse: true,
    };
  }

  if (state === "starting_soon") {
    return {
      state,
      primary: "Starting soon…",
      secondary: diffMs > 0 ? `Starts in ${formatCountdownWithSeconds(diffMs)}` : "Worker should pick this up momentarily",
      title,
      pulse: true,
    };
  }

  if (state === "within_hour") {
    return {
      state,
      primary: `Starts in ${formatCountdownWithSeconds(diffMs)}`,
      secondary: shortTime,
      title,
      pulse: false,
    };
  }

  return {
    state,
    primary: `Next audit · ${shortTime}`,
    secondary: formatNextScanCountdown(target, now, { compact: true }),
    title,
    pulse: false,
  };
}

export function canUseAutomatedScans(frequency: ScanFrequency): boolean {
  return frequency !== ScanFrequency.MANUAL;
}
