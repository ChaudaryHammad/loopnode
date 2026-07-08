"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AUDIT_PHASES, type AuditPhase } from "@/lib/scanner/audit-phases";
import { MODULE_UI_STEPS } from "@/audit-engine/core/progress";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Loader2, Sparkles } from "lucide-react";

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

function resolveStepId(phase: string | null): (typeof MODULE_UI_STEPS)[number]["id"] {
  if (!phase) return "collect";
  const def = AUDIT_PHASES[phase as AuditPhase];
  if (def?.step) return def.step;
  if (phase === "cancelled") return "collect";
  return "collect";
}

function stepStatus(
  stepId: (typeof MODULE_UI_STEPS)[number]["id"],
  activeStep: (typeof MODULE_UI_STEPS)[number]["id"],
  percent: number
): "done" | "active" | "upcoming" {
  const order = MODULE_UI_STEPS.map((s) => s.id);
  const activeIdx = order.indexOf(activeStep);
  const idx = order.indexOf(stepId);
  if (percent >= 100) return "done";
  if (idx < activeIdx) return "done";
  if (idx === activeIdx) return "active";
  return "upcoming";
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

  const activeStep = useMemo(
    () => resolveStepId(progress.phase),
    [progress.phase]
  );

  if (compact) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-foreground line-clamp-2">{headline}</span>
          <span className="text-muted-foreground tabular-nums shrink-0">
            {Math.round(progress.progressPercent)}%
          </span>
        </div>
        <Progress value={Math.min(100, progress.progressPercent)} className="h-2" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {phaseLabel} · {formatElapsed(elapsedMs)}
          </p>
          <div className="flex items-center gap-1">
            {MODULE_UI_STEPS.map((step) => {
              const status = stepStatus(step.id, activeStep, progress.progressPercent);
              return (
                <span
                  key={step.id}
                  className={cn(
                    "h-1.5 w-4 rounded-full transition-colors",
                    status === "done" && "bg-primary",
                    status === "active" && "bg-primary/70 animate-pulse",
                    status === "upcoming" && "bg-muted"
                  )}
                  title={step.label}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        embedded
          ? "space-y-5"
          : "rounded-2xl border border-border/40 bg-card p-5 md:p-6 space-y-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="bg-primary/10 border-primary/20 text-primary gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Live audit
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              Elapsed {formatElapsed(elapsedMs)}
            </span>
          </div>
          <p className="text-base md:text-lg font-medium text-foreground leading-snug tracking-tight">
            {headline}
          </p>
          <p className="text-xs text-muted-foreground">
            Target URL audit · {phaseLabel} · HTTP analysis + Lighthouse lab
          </p>
        </div>
        <div className="text-right shrink-0 rounded-xl border border-border/30 bg-secondary/15 px-4 py-3 min-w-[5.5rem]">
          <p className="text-3xl font-semibold tabular-nums text-foreground leading-none">
            {Math.round(progress.progressPercent)}
            <span className="text-lg text-muted-foreground">%</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">complete</p>
        </div>
      </div>

      <Progress value={Math.min(100, progress.progressPercent)} className="h-2.5" />

      <ol className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {MODULE_UI_STEPS.map((step) => {
          const status = stepStatus(step.id, activeStep, progress.progressPercent);
          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border px-3 py-2.5 transition-colors",
                status === "active" && "border-primary/35 bg-primary/8",
                status === "done" && "border-border/40 bg-secondary/20",
                status === "upcoming" && "border-border/25 bg-transparent opacity-70"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border text-[10px]",
                    status === "done" && "border-primary/40 bg-primary/15 text-primary",
                    status === "active" && "border-primary/50 bg-primary/20 text-primary",
                    status === "upcoming" && "border-border/40 text-muted-foreground"
                  )}
                >
                  {status === "done" ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : status === "active" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    status === "active" ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pl-7">
                {step.description}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
