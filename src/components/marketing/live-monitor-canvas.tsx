"use client";

import React, { useEffect, useState } from "react";
import { StatusDot } from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

type SiteStatus = "healthy" | "degraded" | "down" | "checking";

type Site = {
  name: string;
  host: string;
  latency: string;
  status: SiteStatus;
};

const CYCLE: Site[][] = [
  [
    { name: "Checkout", host: "pay.acme.io", latency: "142ms", status: "healthy" },
    { name: "Marketing", host: "acme.io", latency: "89ms", status: "healthy" },
    { name: "API", host: "api.acme.io", latency: "61ms", status: "healthy" },
    { name: "Docs", host: "docs.acme.io", latency: "118ms", status: "healthy" },
  ],
  [
    { name: "Checkout", host: "pay.acme.io", latency: "142ms", status: "healthy" },
    { name: "Marketing", host: "acme.io", latency: "89ms", status: "healthy" },
    { name: "API", host: "api.acme.io", latency: "—", status: "checking" },
    { name: "Docs", host: "docs.acme.io", latency: "118ms", status: "healthy" },
  ],
  [
    { name: "Checkout", host: "pay.acme.io", latency: "142ms", status: "healthy" },
    { name: "Marketing", host: "acme.io", latency: "89ms", status: "healthy" },
    { name: "API", host: "api.acme.io", latency: "2.4s", status: "degraded" },
    { name: "Docs", host: "docs.acme.io", latency: "118ms", status: "healthy" },
  ],
  [
    { name: "Checkout", host: "pay.acme.io", latency: "142ms", status: "healthy" },
    { name: "Marketing", host: "acme.io", latency: "89ms", status: "healthy" },
    { name: "API", host: "api.acme.io", latency: "timeout", status: "down" },
    { name: "Docs", host: "docs.acme.io", latency: "118ms", status: "healthy" },
  ],
  [
    { name: "Checkout", host: "pay.acme.io", latency: "142ms", status: "healthy" },
    { name: "Marketing", host: "acme.io", latency: "89ms", status: "healthy" },
    { name: "API", host: "api.acme.io", latency: "74ms", status: "healthy" },
    { name: "Docs", host: "docs.acme.io", latency: "118ms", status: "healthy" },
  ],
];

const EVENTS = [
  { t: "14:02:11", label: "SSL certificate valid · 48 days remaining", tone: "ok" as const },
  { t: "14:02:18", label: "Uptime check passed · api.acme.io", tone: "ok" as const },
  { t: "14:04:01", label: "Latency spike detected · p95 2.4s", tone: "warn" as const },
  { t: "14:04:09", label: "Endpoint unreachable · HTTP timeout", tone: "alert" as const },
  { t: "14:04:10", label: "Alert sent · Slack #ops · email on-call", tone: "alert" as const },
  { t: "14:07:42", label: "Recovered · response 74ms · status 200", tone: "ok" as const },
];

function statusTone(status: SiteStatus) {
  if (status === "healthy") return "ok" as const;
  if (status === "degraded") return "warn" as const;
  if (status === "down") return "alert" as const;
  return "idle" as const;
}

function statusLabel(status: SiteStatus) {
  if (status === "healthy") return "Healthy";
  if (status === "degraded") return "Degraded";
  if (status === "down") return "Down";
  return "Checking";
}

export function LiveMonitorCanvas({ className }: { className?: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % CYCLE.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const sites = CYCLE[step];
  const incident = sites.some((s) => s.status === "down" || s.status === "degraded");
  // Reveal events in sync with the cycle without changing layout height.
  const visibleCount = Math.min(2 + step, EVENTS.length);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[var(--ln-panel)] text-white",
        className
      )}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(13,122,111,0.18),transparent_55%)]" />
      </div>

      <div className="relative ln-container py-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--ln-panel-line)] pb-4">
          <div className="flex items-center gap-3">
            <StatusDot tone={incident ? "alert" : "ok"} pulse />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-panel-faint)]">
                Live monitor
              </p>
              <p className="text-sm text-white/90">acme production · 4 endpoints</p>
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-[var(--ln-panel-muted)]">
            <span>Region · multi</span>
            <span>Interval · 60s</span>
            <span
              className={cn(
                "inline-block w-[7.5rem] text-right",
                incident ? "text-[var(--ln-warn-soft)]" : "text-[#7dd3c7]"
              )}
            >
              {incident ? "Incident open" : "All clear"}
            </span>
          </div>
        </div>

        <div className="grid h-auto gap-6 lg:h-[22rem] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex h-full flex-col gap-2">
            {sites.map((site) => (
              <div
                key={site.host}
                className="grid min-h-[4.25rem] flex-1 grid-cols-[1fr_auto_auto] items-center gap-4 rounded-[var(--ln-radius)] border border-[var(--ln-panel-line)] bg-[var(--ln-panel-elevated)]/70 px-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot tone={statusTone(site.status)} pulse={site.status === "checking"} />
                    <p className="truncate text-sm font-medium text-white">{site.name}</p>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--ln-panel-faint)]">
                    {site.host}
                  </p>
                </div>
                <p className="w-14 text-right font-mono text-xs tabular-nums text-[var(--ln-panel-muted)]">
                  {site.latency}
                </p>
                <p
                  className={cn(
                    "w-20 text-right font-mono text-[11px] uppercase tracking-wide transition-colors duration-300",
                    site.status === "healthy" && "text-[#7dd3c7]",
                    site.status === "degraded" && "text-[#f5c26b]",
                    site.status === "down" && "text-[#f2a19a]",
                    site.status === "checking" && "text-[var(--ln-panel-muted)]"
                  )}
                >
                  {statusLabel(site.status)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex h-full min-h-[22rem] flex-col rounded-[var(--ln-radius)] border border-[var(--ln-panel-line)] bg-[var(--ln-panel-elevated)]/50 p-4 lg:min-h-0">
            <p className="mb-4 shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-panel-faint)]">
              Event stream
            </p>
            <div className="flex min-h-0 flex-1 flex-col justify-start gap-0">
              {EVENTS.map((event, i) => {
                const visible = i < visibleCount;
                return (
                  <div
                    key={event.t}
                    className={cn(
                      "flex h-8 shrink-0 items-start gap-3 transition-opacity duration-300",
                      visible ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <span className="w-14 shrink-0 font-mono text-[11px] text-[var(--ln-panel-faint)]">
                      {event.t}
                    </span>
                    <div className="flex min-w-0 items-start gap-2">
                      <StatusDot tone={event.tone} className="mt-1.5" />
                      <p className="truncate text-sm leading-snug text-white/80">{event.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex h-16 shrink-0 items-end gap-1 border-t border-[var(--ln-panel-line)] pt-4">
              {Array.from({ length: 28 }).map((_, i) => {
                const hot = incident && i > 18 && i < 24;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-sm origin-bottom",
                      hot ? "bg-[#f2a19a]" : "bg-[#2a9f90]/70"
                    )}
                    style={{
                      height: `${28 + ((i * 17) % 48)}%`,
                      animation: `ln-bar ${1.6 + (i % 5) * 0.2}s ease-in-out ${i * 0.04}s infinite`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
