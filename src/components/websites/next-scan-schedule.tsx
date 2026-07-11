"use client";

import React, { useEffect, useState } from "react";
import { getNextScanScheduleDisplay, getNextScanTickIntervalMs } from "@/lib/scan-schedule";
import { cn } from "@/lib/utils";
import { CalendarClock, Loader2 } from "lucide-react";

interface NextScanScheduleProps {
  nextScanAt: Date | string;
  timezone?: string;
  variant?: "chip" | "block" | "inline" | "compact";
  isAuditRunning?: boolean;
  className?: string;
}

export function NextScanSchedule({
  nextScanAt,
  timezone = "UTC",
  variant = "block",
  isAuditRunning = false,
  className,
}: NextScanScheduleProps) {
  const target = new Date(nextScanAt);
  const [now, setNow] = useState(() => new Date());

  const display = getNextScanScheduleDisplay(target, timezone, now, { isAuditRunning });
  const tickMs = getNextScanTickIntervalMs(display.state);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(interval);
  }, [tickMs]);

  if (variant === "chip" || variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-primary font-medium",
          display.pulse && "animate-pulse",
          className
        )}
        title={display.title}
      >
        {display.state === "running" ? (
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
        ) : (
          <CalendarClock className="w-3 h-3 shrink-0" />
        )}
        <span>{display.primary}</span>
        {display.secondary && variant === "chip" ? (
          <span className="text-muted-foreground font-normal">· {display.secondary}</span>
        ) : null}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline", className)} title={display.title}>
        <span className="font-medium text-foreground">{display.primary}</span>
        {display.secondary ? (
          <>
            <span className="text-muted-foreground"> · </span>
            <span className="text-primary font-medium">{display.secondary}</span>
          </>
        ) : null}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)} title={display.title}>
      <p
        className={cn(
          "font-medium text-foreground",
          display.pulse && "text-primary animate-pulse"
        )}
      >
        {display.primary}
      </p>
      {display.secondary ? (
        <p className="text-xs text-muted-foreground">{display.secondary}</p>
      ) : null}
    </div>
  );
}
