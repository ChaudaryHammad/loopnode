"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AUDIT_PHASES, type AuditPhase } from "@/lib/scanner/audit-phases";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface AuditProgressState {
  phase: string | null;
  statusMessage: string | null;
  progressPercent: number;
  startedAt?: Date | string | null;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

interface AuditProgressPanelProps {
  progress: AuditProgressState;
  compact?: boolean;
  embedded?: boolean;
  className?: string;
}

export function AuditProgressPanel({
  progress,
  compact = false,
  embedded = false,
  className,
}: AuditProgressPanelProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = progress.startedAt
    ? now - new Date(progress.startedAt).getTime()
    : 0;

  const activePhase = (progress.phase as AuditPhase | null) ?? "queued";
  const phaseLabel =
    activePhase in AUDIT_PHASES ? AUDIT_PHASES[activePhase].label : "Auditing";
  const headline =
    progress.statusMessage ??
    AUDIT_PHASES[activePhase in AUDIT_PHASES ? activePhase : "queued"]?.hint ??
    "Audit in progress…";

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground line-clamp-2">{headline}</span>
          <span className="text-muted-foreground tabular-nums shrink-0">
            {Math.round(progress.progressPercent)}%
          </span>
        </div>
        <Progress value={Math.min(100, progress.progressPercent)} className="h-2" />
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {phaseLabel} · Elapsed {formatElapsed(elapsedMs)}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        embedded
          ? "space-y-4"
          : "rounded-2xl border border-border/40 bg-card p-5 md:p-6 space-y-4",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Audit running
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatElapsed(elapsedMs)}
            </span>
          </div>
          <p className="text-sm md:text-base font-medium text-foreground leading-relaxed">
            {headline}
          </p>
          <p className="text-xs text-muted-foreground">
            {phaseLabel} · Lighthouse performance &amp; best practices (mobile, throttled)
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {Math.round(progress.progressPercent)}%
          </p>
          <p className="text-[11px] text-muted-foreground">complete</p>
        </div>
      </div>

      <Progress value={Math.min(100, progress.progressPercent)} className="h-2.5" />
    </div>
  );
}
