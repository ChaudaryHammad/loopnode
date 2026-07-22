"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Eyebrow,
  MarketingButton,
  Reveal,
  StatusDot,
} from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    id: "performance",
    label: "Performance",
    subtitle: "Lighthouse · Core Web Vitals",
    body: "Real Chrome audits for LCP, INP, CLS, and related findings — scored and tracked over time.",
    sample: [
      { k: "LCP", v: "1.2s", tone: "ok" as const },
      { k: "INP", v: "84ms", tone: "ok" as const },
      { k: "CLS", v: "0.04", tone: "ok" as const },
      { k: "Score", v: "98", tone: "ok" as const },
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    subtitle: "axe-core · WCAG",
    body: "Automated axe-core checks with severity, location, and remediation guidance.",
    sample: [
      { k: "Critical", v: "0", tone: "ok" as const },
      { k: "Serious", v: "2", tone: "warn" as const },
      { k: "Moderate", v: "5", tone: "warn" as const },
      { k: "Score", v: "91", tone: "ok" as const },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    subtitle: "Metadata · crawl signals",
    body: "Title, meta, canonical, and indexability issues surfaced alongside actionable fixes.",
    sample: [
      { k: "Title", v: "OK", tone: "ok" as const },
      { k: "Canonical", v: "Missing", tone: "warn" as const },
      { k: "Robots", v: "OK", tone: "ok" as const },
      { k: "Score", v: "86", tone: "warn" as const },
    ],
  },
  {
    id: "security",
    label: "Security",
    subtitle: "Headers · CSP",
    body: "Security headers and CSP grading so common misconfigurations are visible early.",
    sample: [
      { k: "HSTS", v: "Present", tone: "ok" as const },
      { k: "CSP", v: "Weak", tone: "warn" as const },
      { k: "XFO", v: "Present", tone: "ok" as const },
      { k: "Grade", v: "B", tone: "warn" as const },
    ],
  },
  {
    id: "coverage",
    label: "Coverage",
    subtitle: "Broken pages · assets",
    body: "Crawl unreachable routes, dead assets, and soft failures across your site map.",
    sample: [
      { k: "Crawled", v: "248", tone: "ok" as const },
      { k: "404s", v: "3", tone: "alert" as const },
      { k: "Assets", v: "1 broken", tone: "alert" as const },
      { k: "Depth", v: "4", tone: "ok" as const },
    ],
  },
  {
    id: "uptime",
    label: "Uptime & SSL",
    subtitle: "Availability · certificates",
    body: "Continuous checks for downtime, latency spikes, and certificate expiry windows.",
    sample: [
      { k: "Status", v: "Up", tone: "ok" as const },
      { k: "Latency", v: "94ms", tone: "ok" as const },
      { k: "SSL", v: "48d left", tone: "ok" as const },
      { k: "Interval", v: "60s", tone: "ok" as const },
    ],
  },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

const FAQ = [
  {
    q: "Do audits use real engines?",
    a: "Yes. Performance uses Lighthouse in a real Chrome instance. Accessibility uses axe-core. Coverage crawls your site graph separately.",
  },
  {
    q: "Can Health Mesh audit authenticated pages?",
    a: "Not yet. Current audits target publicly reachable URLs. Authenticated flows are on the roadmap.",
  },
  {
    q: "How is coverage different from the main audit?",
    a: "Coverage is a dedicated crawl for unreachable pages and assets. It runs separately from the Lighthouse/axe audit pass.",
  },
];

export default function FeaturesPage() {
  const [active, setActive] = useState<ModuleId>(MODULES[0].id);

  return (
    <div className="flex-1">
      <div className="ln-container py-20 md:py-28">
        <Reveal>
          <Eyebrow>Product</Eyebrow>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-tight tracking-tight md:text-6xl">
            Monitoring built around what actually breaks.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ln-muted)]">
            Uptime, SSL, audits, and coverage in one calm system — designed for
            teams that fix things, not decorate dashboards.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MarketingButton href="/register">
              Start free trial
              <ArrowRight className="size-4" />
            </MarketingButton>
            <MarketingButton href="/pricing" variant="secondary">
              View pricing
            </MarketingButton>
          </div>
        </Reveal>
      </div>

      <div className="border-y border-[var(--ln-line)] bg-[var(--ln-surface)]">
        <div className="ln-container py-3">
          <div className="flex gap-1 overflow-x-auto">
            {MODULES.map((module) => (
              <a
                key={module.id}
                href={`#${module.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActive(module.id);
                  document.getElementById(module.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className={cn(
                  "shrink-0 rounded-[var(--ln-radius-sm)] px-3 py-2 text-sm transition-colors",
                  active === module.id
                    ? "bg-[var(--ln-ink)] text-white"
                    : "text-[var(--ln-muted)] hover:text-[var(--ln-ink)]"
                )}
              >
                {module.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="ln-container py-20 md:py-28">
        <div className="grid gap-16">
          {MODULES.map((module, index) => (
            <section
              key={module.id}
              id={module.id}
              className="scroll-mt-28 grid items-center gap-10 lg:grid-cols-2"
            >
              <Reveal delay={0.05}>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
                  {module.subtitle}
                </p>
                <h2 className="mt-3 font-display text-3xl font-medium md:text-4xl">
                  {module.label}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--ln-muted)]">
                  {module.body}
                </p>
              </Reveal>

              <Reveal delay={0.1}>
                <button
                  type="button"
                  onClick={() => setActive(module.id)}
                  className={cn(
                    "w-full rounded-[var(--ln-radius-lg)] border p-6 text-left transition-all md:p-8",
                    index % 2 === 0
                      ? "border-[var(--ln-panel-line)] bg-[var(--ln-panel)] text-white"
                      : "border-[var(--ln-line)] bg-[var(--ln-bg)]"
                  )}
                >
                  <div className="mb-6 flex items-center gap-2">
                    <StatusDot tone="ok" pulse />
                    <span
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-[0.16em]",
                        index % 2 === 0
                          ? "text-[var(--ln-panel-faint)]"
                          : "text-[var(--ln-faint)]"
                      )}
                    >
                      Live sample
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {module.sample.map((row) => (
                      <div
                        key={row.k}
                        className={cn(
                          "rounded-[var(--ln-radius-sm)] border px-3 py-3",
                          index % 2 === 0
                            ? "border-[var(--ln-panel-line)] bg-black/20"
                            : "border-[var(--ln-line)] bg-[var(--ln-surface)]"
                        )}
                      >
                        <p
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            index % 2 === 0
                              ? "text-[var(--ln-panel-faint)]"
                              : "text-[var(--ln-faint)]"
                          )}
                        >
                          {row.k}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <StatusDot tone={row.tone} />
                          <p
                            className={cn(
                              "font-mono text-sm",
                              index % 2 === 0 ? "text-white" : "text-[var(--ln-ink)]"
                            )}
                          >
                            {row.v}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </button>
              </Reveal>
            </section>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--ln-line)] bg-[var(--ln-surface)]">
        <div className="ln-container py-20 md:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-medium">Questions</h2>
          </Reveal>
          <div className="mt-8 divide-y divide-[var(--ln-line)] border-y border-[var(--ln-line)]">
            {FAQ.map((item) => (
              <div key={item.q} className="grid gap-3 py-6 md:grid-cols-[0.9fr_1.1fr]">
                <p className="text-sm font-medium">{item.q}</p>
                <p className="text-sm leading-relaxed text-[var(--ln-muted)]">{item.a}</p>
              </div>
            ))}
          </div>

          <Reveal className="mt-16">
            <div className="rounded-[var(--ln-radius-lg)] bg-[var(--ln-panel)] px-8 py-12 text-center md:px-12">
              <p className="font-display text-3xl font-medium text-white">
                Run your first audit.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ln-panel-muted)]">
                Add a site, get signal, fix what matters.
              </p>
              <div className="mt-7 flex justify-center">
                <MarketingButton href="/register" variant="panel">
                  Start free trial
                  <ArrowRight className="size-4" />
                </MarketingButton>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
