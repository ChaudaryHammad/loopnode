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

export function formatNextScanAt(date: Date | null | undefined, timezone = "UTC"): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function canUseAutomatedScans(frequency: ScanFrequency): boolean {
  return frequency !== ScanFrequency.MANUAL;
}
