"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Severity = "critical" | "serious" | "moderate" | "minor";

type Finding = {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  page: string;
  recommendation: string;
  time: string;
};

const FINDINGS: Finding[] = [
  {
    id: "f1",
    category: "Accessibility",
    severity: "serious",
    title: "Images missing alternative text",
    page: "/pricing",
    recommendation: "Add alt text describing the product screenshot intent.",
    time: "14:02:11",
  },
  {
    id: "f2",
    category: "SEO",
    severity: "moderate",
    title: "Duplicate titles across blog templates",
    page: "/blog/*",
    recommendation: "Bind unique titles to each article slug.",
    time: "14:02:18",
  },
  {
    id: "f3",
    category: "Security",
    severity: "serious",
    title: "CSP allows unsafe-inline scripts",
    page: "global",
    recommendation: "Move to nonces; drop unsafe-inline from script-src.",
    time: "14:02:24",
  },
  {
    id: "f4",
    category: "Coverage",
    severity: "critical",
    title: "Checkout asset returns 404",
    page: "/checkout",
    recommendation: "Restore /assets/pay-mark.svg or update the reference.",
    time: "14:02:31",
  },
  {
    id: "f5",
    category: "Performance",
    severity: "moderate",
    title: "LCP blocked by uncompressed hero",
    page: "/",
    recommendation: "Preload hero image; serve AVIF under 200KB.",
    time: "14:02:39",
  },
  {
    id: "f6",
    category: "SSL",
    severity: "minor",
    title: "Certificate expires in 48 days",
    page: "acme.io",
    recommendation: "Schedule renewal before the 14-day warning window.",
    time: "14:02:44",
  },
  {
    id: "f7",
    category: "Redirects",
    severity: "moderate",
    title: "Three-hop redirect chain",
    page: "/docs/old",
    recommendation: "Collapse to one 301 toward the current docs path.",
    time: "14:02:52",
  },
  {
    id: "f8",
    category: "Metadata",
    severity: "serious",
    title: "Product pages missing canonical",
    page: "/products/*",
    recommendation: "Emit a self-referencing canonical per product URL.",
    time: "14:03:01",
  },
];

const CRAWL_PATHS = [
  "/",
  "/pricing",
  "/features",
  "/docs",
  "/checkout",
  "/blog",
  "/login",
  "/products/mesh",
  "/sitemap.xml",
  "/robots.txt",
];

const HISTORY = [
  { day: "Mon", score: 86 },
  { day: "Tue", score: 88 },
  { day: "Wed", score: 84 },
  { day: "Thu", score: 90 },
  { day: "Fri", score: 91 },
  { day: "Sat", score: 93 },
  { day: "Sun", score: 94 },
];

const REPORTS_BUILDING = [
  "Executive summary",
  "Accessibility",
  "Security",
  "Performance",
];

const ease = [0.22, 1, 0.36, 1] as const;

const SEV: Record<
  Severity,
  { label: string; dot: string; text: string; chip: string }
> = {
  critical: {
    label: "Critical",
    dot: "bg-[#f2a19a]",
    text: "text-[#f2a19a]",
    chip: "border-[#f2a19a]/30 bg-[#f2a19a]/10 text-[#f2a19a]",
  },
  serious: {
    label: "Serious",
    dot: "bg-[#f0c674]",
    text: "text-[#f0c674]",
    chip: "border-[#f0c674]/30 bg-[#f0c674]/10 text-[#f0c674]",
  },
  moderate: {
    label: "Moderate",
    dot: "bg-[#9ec5e8]",
    text: "text-[#9ec5e8]",
    chip: "border-[#9ec5e8]/30 bg-[#9ec5e8]/10 text-[#9ec5e8]",
  },
  minor: {
    label: "Minor",
    dot: "bg-white/40",
    text: "text-white/55",
    chip: "border-white/15 bg-white/5 text-white/55",
  },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * Reasoning surface: crawl → classify → recommend → rank → report.
 * Not a dashboard mock — a living system diagram.
 */
export function IssueIntelligence({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [pages, setPages] = useState(214);
  const [depth, setDepth] = useState(3);
  const [reportStep, setReportStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % FINDINGS.length);
      setPages((p) => (p >= 340 ? 200 : p + 6));
      setDepth((d) => (d >= 5 ? 2 : d + (Math.random() > 0.6 ? 1 : 0)));
      setReportStep((s) => (s + 1) % (REPORTS_BUILDING.length + 1));
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduced]);

  const active = FINDINGS[tick];
  const crawlIndex = tick % CRAWL_PATHS.length;

  const queue = useMemo(() => {
    const order: Severity[] = ["critical", "serious", "moderate", "minor"];
    return Array.from({ length: 4 }, (_, i) => {
      const idx = (tick - i + FINDINGS.length) % FINDINGS.length;
      return FINDINGS[idx];
    }).sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  }, [tick]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-white/10 bg-[#070b10] text-white",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(13,122,111,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_90%_80%,rgba(40,70,110,0.22),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 70% 65% at 50% 40%, black 10%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative">
        {/* System header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="relative flex size-2">
              <span
                className={cn(
                  "absolute inset-0 rounded-full bg-[var(--ln-signal)]/70",
                  !reduced && "animate-ping"
                )}
              />
              <span className="relative size-2 rounded-full bg-[var(--ln-signal)]" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
                Reasoning loop
              </p>
              <p className="mt-0.5 text-sm text-white/85">acme.io · live crawl</p>
            </div>
          </div>
          <div className="flex gap-5 font-mono text-[11px] text-white/40">
            <span>
              Pages <span className="text-white/80 tabular-nums">{pages}</span>
            </span>
            <span>
              Depth <span className="text-white/80 tabular-nums">{depth}</span>
            </span>
            <span className="text-[var(--ln-signal)]">Classifying</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.85fr_1.3fr_0.95fr]">
          {/* Crawl rail */}
          <div className="border-b border-white/[0.07] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Continuous crawl
            </p>
            <div className="relative mt-4 h-[16.5rem] overflow-hidden rounded-[var(--ln-radius)] border border-white/[0.06] bg-black/30">
              <div className="absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#070b10] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[#070b10] to-transparent" />
              <div className="space-y-1.5 p-3 pt-4 font-mono text-[11px]">
                <AnimatePresence initial={false}>
                  {Array.from({ length: 8 }).map((_, i) => {
                    const path =
                      CRAWL_PATHS[
                        (crawlIndex - i + CRAWL_PATHS.length * 3) %
                          CRAWL_PATHS.length
                      ];
                    const hot = i === 0;
                    return (
                      <motion.div
                        key={`${path}-${tick}-${i}`}
                        initial={reduced ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: hot ? 1 : 0.35 - i * 0.03, y: 0 }}
                        className={cn(
                          "flex items-center gap-2 rounded px-2 py-1.5",
                          hot && "bg-[var(--ln-signal)]/10 text-[var(--ln-signal)]"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1 shrink-0 rounded-full",
                            hot ? "bg-[var(--ln-signal)]" : "bg-white/25"
                          )}
                        />
                        <span className="truncate">{path}</span>
                        {hot ? (
                          <span className="ml-auto text-[10px] uppercase tracking-wider opacity-80">
                            scanning
                          </span>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              {!reduced ? (
                <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px overflow-hidden">
                  <div className="ln-animate-scan h-full w-1/2 bg-gradient-to-r from-transparent via-[var(--ln-signal)] to-transparent opacity-70" />
                </div>
              ) : null}
            </div>
          </div>

          {/* Classification focus */}
          <div className="border-b border-white/[0.07] p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Classify · recommend
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease }}
                className="mt-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                      SEV[active.severity].chip
                    )}
                  >
                    {SEV[active.severity].label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-white/50">
                    {active.category}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/30">
                    {active.time}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-xl font-medium leading-snug tracking-tight text-white sm:text-2xl">
                  {active.title}
                </h3>
                <p className="mt-2 font-mono text-xs text-white/40">{active.page}</p>

                <div className="mt-6 rounded-[var(--ln-radius)] border border-[var(--ln-signal)]/25 bg-[var(--ln-signal)]/[0.07] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ln-signal)]">
                    Suggested next step
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    {active.recommendation}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-white/40">
                  <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/10 font-mono text-[10px]">
                    AI
                  </span>
                  Grouped with 2 similar findings · same rule family
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Rank + history + report */}
          <div className="p-5 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Rank · history · report
            </p>

            <div className="mt-4 space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {queue.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={reduced ? false : { opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="flex items-center gap-2.5 rounded-[var(--ln-radius-sm)] border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
                  >
                    <span className="w-3 font-mono text-[10px] text-white/30">
                      {i + 1}
                    </span>
                    <span className={cn("size-1.5 rounded-full", SEV[item.severity].dot)} />
                    <span className="min-w-0 flex-1 truncate text-xs text-white/80">
                      {item.title}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* History spark */}
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
                7-day health
              </p>
              <div className="mt-2 flex h-12 items-end gap-1.5">
                {HISTORY.map((h, i) => (
                  <div key={h.day} className="flex flex-1 flex-col items-center gap-1">
                    <motion.div
                      className="w-full rounded-sm bg-[var(--ln-signal)]/70"
                      initial={false}
                      animate={{ height: 8 + (h.score / 100) * 32 }}
                      transition={{ duration: 0.6, delay: i * 0.04, ease }}
                    />
                    <span className="font-mono text-[8px] text-white/25">{h.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Report assembly */}
            <div className="mt-5 rounded-[var(--ln-radius)] border border-white/[0.08] bg-black/25 p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                  Assembling report
                </p>
                <span className="font-mono text-[10px] text-white/40">PDF</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {REPORTS_BUILDING.map((label, i) => {
                  const done = i < reportStep;
                  const activeStep = i === reportStep;
                  return (
                    <div
                      key={label}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors",
                        done && "text-white/70",
                        activeStep && "bg-white/[0.05] text-white",
                        !done && !activeStep && "text-white/25"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          done && "bg-[var(--ln-signal)]",
                          activeStep && "bg-white animate-pulse",
                          !done && !activeStep && "bg-white/20"
                        )}
                      />
                      {label}
                      {done ? (
                        <span className="ml-auto font-mono text-[9px] text-[var(--ln-signal)]">
                          ready
                        </span>
                      ) : null}
                      {activeStep ? (
                        <span className="ml-auto font-mono text-[9px] text-white/40">
                          writing…
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
