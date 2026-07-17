"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AUDIT_PHASES, type AuditPhase } from "@/lib/scanner/audit-phases";
import { MODULE_UI_STEPS } from "@/audit-engine/core/progress";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Check,
  FileText,
  FlaskConical,
  Globe,
  Loader2,
  ScanSearch,
} from "lucide-react";

export interface AuditProgressState {
  phase: string | null;
  statusMessage: string | null;
  progressPercent: number;
  startedAt?: Date | string | null;
}

type StepId = (typeof MODULE_UI_STEPS)[number]["id"];

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function resolveStepId(phase: string | null): StepId {
  if (!phase) return "collect";
  const def = AUDIT_PHASES[phase as AuditPhase];
  if (def?.step) return def.step;
  return "collect";
}

function stepStatus(
  stepId: StepId,
  activeStep: StepId,
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

function useElapsed(startedAt?: Date | string | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return startedAt ? Math.max(0, now - new Date(startedAt).getTime()) : 0;
}

function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-primary" />
    </span>
  );
}

function GradientBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <Progress value={Math.min(100, Math.max(0, percent))} className={className}>
      <ProgressTrack className="h-2 bg-muted/60">
        <ProgressIndicator className="relative rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary transition-[width] duration-700 ease-out">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-8 rounded-full bg-gradient-to-r from-transparent to-white/25"
          />
        </ProgressIndicator>
      </ProgressTrack>
    </Progress>
  );
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
  const elapsedMs = useElapsed(progress.startedAt);
  const percent = Math.round(Math.min(100, Math.max(0, progress.progressPercent)));

  const activePhase = (progress.phase as AuditPhase | null) ?? "queued";
  const phaseDef = AUDIT_PHASES[activePhase in AUDIT_PHASES ? activePhase : "queued"];
  const phaseLabel = phaseDef?.label ?? "Auditing";

  const activeStep = useMemo(
    () => resolveStepId(progress.phase),
    [progress.phase]
  );

  const headline =
    percent >= 100 ? "Audit complete" : STEP_TITLES[activeStep];
  const liveStatus =
    progress.statusMessage ?? phaseDef?.hint ?? "Audit in progress…";

  if (compact) {
    return (
      <div className={cn("space-y-2.5", className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Loader2
              className="mt-0.5 size-3.5 shrink-0 animate-spin text-primary"
              aria-hidden="true"
            />
            <span
              key={liveStatus}
              role="status"
              aria-live="polite"
              title={liveStatus}
              className="line-clamp-2 text-sm font-medium text-foreground animate-in fade-in duration-300"
            >
              {liveStatus}
            </span>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {percent}%
          </span>
        </div>

        <GradientBar percent={percent} />

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {phaseLabel} · {formatElapsed(elapsedMs)}
          </p>
          <div className="flex items-center gap-1" aria-hidden="true">
            {MODULE_UI_STEPS.map((step) => {
              const status = stepStatus(step.id, activeStep, percent);
              return (
                <span
                  key={step.id}
                  className={cn(
                    "h-1.5 w-4 rounded-full transition-colors duration-300",
                    status === "done" && "bg-primary",
                    status === "active" && "animate-pulse bg-primary/70",
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
    <section
      aria-label="Live audit progress"
      className={cn(
        embedded
          ? "space-y-5"
          : "space-y-5 rounded-2xl border border-border/40 bg-card p-5 md:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <LiveDot />
              Live audit
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground">
              {phaseLabel}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatElapsed(elapsedMs)} elapsed
            </span>
          </div>

          <p
            key={headline}
            className="text-base font-medium leading-snug tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-1 duration-300 md:text-lg"
          >
            {headline}
          </p>

          <p className="text-xs text-muted-foreground">
            Target URL audit · HTTP analysis + Lighthouse lab
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-4xl font-semibold leading-none tabular-nums tracking-tight text-foreground">
            {percent}
            <span className="ml-0.5 text-xl font-normal text-muted-foreground">
              %
            </span>
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Complete
          </p>
        </div>
      </div>

      <GradientBar percent={percent} />

      <AuditStageRail
        activeStep={activeStep}
        percent={percent}
        liveStatus={liveStatus}
      />
    </section>
  );
}

/** Stable stage-level titles for the panel headline. */
const STEP_TITLES: Record<StepId, string> = {
  collect: "Collecting your page…",
  analyze: "Analyzing your site…",
  lab: "Running the Lighthouse lab…",
  report: "Wrapping up your report…",
};

const STEP_ICONS: Record<StepId, React.ComponentType<{ className?: string }>> = {
  collect: Globe,
  analyze: ScanSearch,
  lab: FlaskConical,
  report: FileText,
};

/**
 * Horizontal stage rail: icon nodes joined by connector lines that fill as
 * the audit advances, with the live status message shown beneath.
 */
function AuditStageRail({
  activeStep,
  percent,
  liveStatus,
}: {
  activeStep: StepId;
  percent: number;
  liveStatus: string;
}) {
  const finished = percent >= 100;

  return (
    <div className="space-y-3">
      <ol className="grid grid-cols-4" aria-label="Audit stages">
        {MODULE_UI_STEPS.map((step, index) => {
          const status = stepStatus(step.id, activeStep, percent);
          const Icon = STEP_ICONS[step.id];
          const connectorFilled = status === "done" || status === "active";

          return (
            <li
              key={step.id}
              aria-current={status === "active" ? "step" : undefined}
              className="relative flex flex-col items-center gap-2"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-[19px] h-px",
                    "left-[calc(-50%+26px)] right-[calc(50%+26px)]",
                    "transition-colors duration-500",
                    connectorFilled
                      ? status === "active"
                        ? "bg-gradient-to-r from-primary to-primary/30"
                        : "bg-primary/70"
                      : "bg-border/60"
                  )}
                />
              ) : null}

              <span className="relative flex size-10 items-center justify-center">
                {status === "active" ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2s]"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full border transition-all duration-300",
                    status === "done" &&
                      "border-primary bg-primary text-primary-foreground",
                    status === "active" &&
                      "border-primary/60 bg-primary/10 text-primary shadow-[0_0_16px_-2px_theme(colors.primary/40%)]",
                    status === "upcoming" &&
                      "border-border/50 bg-card text-muted-foreground/50"
                  )}
                >
                  {status === "done" ? (
                    <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <Icon
                      className={cn(
                        "size-4",
                        status === "active" && "animate-pulse"
                      )}
                    />
                  )}
                </span>
              </span>

              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wide transition-colors duration-300 md:text-xs",
                  status === "active" && "text-primary",
                  status === "done" && "text-foreground",
                  status === "upcoming" && "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
              <span className="sr-only">
                {status === "done"
                  ? "completed"
                  : status === "active"
                    ? "in progress"
                    : "pending"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="space-y-1">
        <p
          key={finished ? "finished" : liveStatus}
          role="status"
          aria-live="polite"
          title={liveStatus}
          className="line-clamp-2 text-center text-xs text-muted-foreground animate-in fade-in duration-300"
        >
          {finished ? "All stages complete — preparing your report…" : liveStatus}
        </p>
        {!finished && activeStep === "lab" ? (
          <p className="text-center text-[11px] text-muted-foreground/60 animate-in fade-in duration-500">
            The lab loads your site in a real Chrome browser — it&apos;s the most
            thorough step and usually takes about a minute.
          </p>
        ) : null}
      </div>
    </div>
  );
}
