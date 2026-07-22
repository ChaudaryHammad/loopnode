"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Frame = {
  overall: number;
  host: string;
  status: "Healthy" | "Degraded" | "Down";
  checkedAt: string;
  nextRun: string;
  event: string;
  metrics: {
    label: string;
    value: string;
    hint: string;
    score: number;
  }[];
};

const FRAMES: Frame[] = [
  {
    host: "acme.io",
    overall: 94,
    status: "Healthy",
    checkedAt: "2m ago",
    nextRun: "47m",
    event: "Audit complete · accessibility and security clear",
    metrics: [
      { label: "Uptime", value: "99.98%", hint: "24h", score: 99 },
      { label: "SSL", value: "48d", hint: "remaining", score: 96 },
      { label: "Security", value: "96", hint: "headers · TLS", score: 96 },
      { label: "Accessibility", value: "94", hint: "WCAG AA", score: 94 },
    ],
  },
  {
    host: "acme.io",
    overall: 84,
    status: "Degraded",
    checkedAt: "just now",
    nextRun: "8m",
    event: "Accessibility dropped · 6 contrast issues",
    metrics: [
      { label: "Uptime", value: "99.98%", hint: "24h", score: 99 },
      { label: "SSL", value: "48d", hint: "remaining", score: 96 },
      { label: "Security", value: "91", hint: "CSP missing", score: 91 },
      { label: "Accessibility", value: "72", hint: "6 issues", score: 72 },
    ],
  },
  {
    host: "acme.io",
    overall: 61,
    status: "Down",
    checkedAt: "just now",
    nextRun: "now",
    event: "Uptime check failed · on-call notified",
    metrics: [
      { label: "Uptime", value: "99.91%", hint: "24h", score: 97 },
      { label: "SSL", value: "48d", hint: "remaining", score: 96 },
      { label: "Security", value: "88", hint: "HSTS weak", score: 88 },
      { label: "Accessibility", value: "70", hint: "8 issues", score: 70 },
    ],
  },
  {
    host: "acme.io",
    overall: 93,
    status: "Healthy",
    checkedAt: "1m ago",
    nextRun: "58m",
    event: "Recovered · uptime stable · scores restored",
    metrics: [
      { label: "Uptime", value: "99.97%", hint: "24h", score: 99 },
      { label: "SSL", value: "48d", hint: "remaining", score: 96 },
      { label: "Security", value: "95", hint: "headers · TLS", score: 95 },
      { label: "Accessibility", value: "93", hint: "WCAG AA", score: 93 },
    ],
  },
];

function statusColor(status: Frame["status"]) {
  if (status === "Healthy") return "var(--ln-signal)";
  if (status === "Degraded") return "var(--ln-warn)";
  return "var(--ln-alert)";
}

function ringColor(score: number) {
  if (score >= 90) return "#0d7a6f";
  if (score >= 70) return "#b54708";
  return "#b42318";
}

function OverallRing({ score }: { score: number }) {
  const size = 148;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.78;
  const gap = circumference - arc;
  const progress = (score / 100) * arc;
  const color = ringColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <g transform={`rotate(148 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(10,12,16,0.06)"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${gap}`}
            strokeLinecap="round"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ln-faint)]">
          Overall
        </span>
      </div>
    </div>
  );
}

export function LiveMonitorCanvas({ className }: { className?: string }) {
  const [step, setStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % FRAMES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const frame = FRAMES[step];
  const accent = statusColor(frame.status);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-[var(--ln-line)] bg-[var(--ln-surface)] shadow-[0_1px_1px_rgba(10,12,16,0.03),0_28px_64px_rgba(10,12,16,0.10)]",
        className
      )}
      aria-hidden="true"
    >
      {/* Quiet top wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,122,111,0.07),transparent_70%)]" />

      <div className="relative px-6 py-6 sm:px-8 sm:py-7 md:px-10 md:py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {/* Cadence mark */}
              <span className="inline-flex h-3.5 items-stretch gap-[2.5px]" aria-hidden>
                <span className="w-[2.5px] rounded-[0.5px] bg-[var(--ln-ink)]" />
                <span className="w-[2.5px] rounded-[0.5px] bg-[var(--ln-ink)]" />
                <span className="w-[2.5px] rounded-[0.5px] bg-[var(--ln-ink)]" />
                <span className="w-[2.5px] rounded-[0.5px] bg-[var(--ln-ink)]" />
                <span className="w-[1.5px] rounded-[0.5px] bg-[var(--ln-ink)] opacity-35" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
                Health Mesh
              </p>
            </div>
            <p className="mt-3 font-display text-xl font-semibold tracking-tight text-[var(--ln-ink)] sm:text-2xl">
              {frame.host}
            </p>
            <p className="mt-1 text-sm text-[var(--ln-muted)]">
              Checked {frame.checkedAt}
              <span className="mx-2 text-[var(--ln-line-strong)]">·</span>
              Next scan {frame.nextRun}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span
              className="size-1.5 rounded-full"
              style={{ background: accent }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: accent }}
            >
              {frame.status}
            </span>
          </div>
        </div>

        {/* Focal score + metrics */}
        <div className="mt-8 grid items-center gap-8 border-t border-[var(--ln-line)] pt-8 lg:grid-cols-[180px_1fr] lg:gap-12">
          <div className="flex justify-center lg:justify-start">
            <OverallRing score={frame.overall} />
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4 sm:gap-x-0">
            {frame.metrics.map((metric, i) => (
              <div
                key={metric.label}
                className={cn(
                  "min-w-0 sm:px-5",
                  i > 0 && "sm:border-l sm:border-[var(--ln-line)]"
                )}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
                  {metric.label}
                </p>
                <p
                  key={`${metric.label}-${metric.value}`}
                  className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums text-[var(--ln-ink)] sm:text-[1.65rem]"
                >
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-[var(--ln-muted)]">{metric.hint}</p>
                {/* Tiny score track */}
                <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-[rgba(10,12,16,0.06)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      width: `${metric.score}%`,
                      background: ringColor(metric.score),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event */}
        <div className="mt-8 flex items-center gap-3 border-t border-[var(--ln-line)] pt-5">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: accent }}
          />
          <p
            key={frame.event}
            className="text-sm text-[var(--ln-ink-soft)]"
          >
            {frame.event}
          </p>
        </div>
      </div>
    </div>
  );
}
