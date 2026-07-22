"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eyebrow, Reveal } from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
  {
    id: "executive",
    label: "Executive",
    blurb: "One-page health, risk, and trend.",
    pages: ["Cover", "Score trend", "Top risks", "Actions"],
  },
  {
    id: "developer",
    label: "Developer",
    blurb: "Findings with paths, severity, and fixes.",
    pages: ["Open issues", "By route", "Repro notes", "Changelog"],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    blurb: "WCAG-oriented violations and impact.",
    pages: ["Summary", "By severity", "Affected UI", "Remediation"],
  },
  {
    id: "seo",
    label: "SEO",
    blurb: "Crawl signals, metadata, indexability.",
    pages: ["Index health", "Metadata", "Canonicals", "Sitemap"],
  },
  {
    id: "performance",
    label: "Performance",
    blurb: "Core Web Vitals and lab scores.",
    pages: ["CWV", "Lighthouse", "Opportunities", "History"],
  },
  {
    id: "security",
    label: "Security",
    blurb: "Headers, TLS, and exposure checks.",
    pages: ["Grade", "Headers", "TLS", "Recommendations"],
  },
] as const;

/**
 * Report generation — visual story of assembling shareable insight.
 */
export function FeaturesReportsSection() {
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % REPORT_TYPES.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduced]);

  const report = REPORT_TYPES[active];

  return (
    <section className="border-t border-[var(--ln-line)] bg-[var(--ln-surface)] py-20 md:py-28">
      <div className="ln-container">
        <Reveal>
          <Eyebrow>Reports</Eyebrow>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-[var(--ln-ink)] md:text-4xl md:leading-[1.12]">
            Same scan.
            <br className="hidden sm:block" />
            Different audience.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--ln-muted)]">
            Export the story leadership needs — or the detail engineers need —
            as shareable PDFs with history baked in.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal delay={0.05}>
            <div className="flex flex-col gap-1.5">
              {REPORT_TYPES.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "rounded-[var(--ln-radius)] border px-4 py-3 text-left transition-colors",
                    i === active
                      ? "border-[var(--ln-ink)]/15 bg-[var(--ln-ink)] text-white"
                      : "border-transparent bg-transparent text-[var(--ln-muted)] hover:bg-[var(--ln-bg)] hover:text-[var(--ln-ink)]"
                  )}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs leading-relaxed",
                      i === active ? "text-white/60" : "text-[var(--ln-faint)]"
                    )}
                  >
                    {item.blurb}
                  </p>
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[24px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,122,111,0.08),transparent_60%)]" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={report.id}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-[20px] border border-[var(--ln-line)] bg-[var(--ln-bg)] shadow-[0_24px_60px_rgba(10,12,16,0.08)]"
                >
                  {/* Document chrome */}
                  <div className="flex items-center justify-between border-b border-[var(--ln-line)] bg-[var(--ln-surface)] px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--ln-signal)]" />
                      <p className="font-mono text-[11px] text-[var(--ln-muted)]">
                        acme.io · {report.label} report
                      </p>
                    </div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ln-faint)]">
                      PDF · shareable
                    </p>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                    {report.pages.map((page, i) => (
                      <motion.div
                        key={page}
                        initial={reduced ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 + i * 0.06 }}
                        className="rounded-[var(--ln-radius)] border border-[var(--ln-line)] bg-[var(--ln-surface)] p-4"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ln-faint)]">
                          Section {String(i + 1).padStart(2, "0")}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--ln-ink)]">
                          {page}
                        </p>
                        <div className="mt-3 space-y-1.5">
                          <div className="h-1.5 w-[88%] rounded-full bg-[var(--ln-bg-deep)]" />
                          <div className="h-1.5 w-[72%] rounded-full bg-[var(--ln-bg-deep)]" />
                          <div className="h-1.5 w-[64%] rounded-full bg-[var(--ln-bg-deep)]" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-[var(--ln-line)] px-5 py-3 text-xs text-[var(--ln-muted)]">
                    <span>Compared to last 30 days</span>
                    <span className="font-mono text-[var(--ln-signal-ink)]">
                      +3 vs prior
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
