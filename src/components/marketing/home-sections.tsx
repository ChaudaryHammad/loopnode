"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import {
  Eyebrow,
  MarketingButton,
  Reveal,
  Section,
} from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";
import {
  PLAN_LABELS,
  PLAN_PRICES_USD,
  PLAN_SITE_LIMITS,
} from "@/lib/plans";

const SIGNALS = [
  "Uptime",
  "Accessibility",
  "SSL",
  "Performance",
  "Coverage",
  "Security",
] as const;

const PIPELINE = [
  {
    step: "01",
    title: "Add a site",
    body: "Point Health Mesh at a URL. No agents. No SDK.",
  },
  {
    step: "02",
    title: "Watch continuously",
    body: "Uptime, accessibility, SSL, and audits on your cadence.",
  },
  {
    step: "03",
    title: "Fix what matters",
    body: "Clear alerts and findings — before customers feel them.",
  },
];

export function HomeSections({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primaryHref = isLoggedIn ? "/dashboard" : "/register";

  return (
    <>
      <Section className="border-y border-[var(--ln-line)] bg-[var(--ln-surface)]">
        <div className="ln-container flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4">
          {SIGNALS.map((signal, i) => (
            <React.Fragment key={signal}>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-muted)]">
                {signal}
              </span>
              {i < SIGNALS.length - 1 && (
                <span className="hidden h-3 w-px bg-[var(--ln-line-strong)] sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* Mission */}
      <Section className="py-20 md:py-24">
        <div className="ln-container">
          <Reveal>
            <Eyebrow>Our motive</Eyebrow>
            <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight text-[var(--ln-ink)] md:text-5xl">
              Every product should work for everyone.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ln-muted)] md:text-lg">
              Reliability is more than uptime. It is whether people can actually use
              what you ship — including people with disabilities. Health Mesh helps teams
              keep products open, accessible, and compliant, so the web speaks to more
              of us.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Pipeline */}
      <Section className="py-20 md:py-24" tone="surface">
        <div className="ln-container">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-medium leading-tight md:text-4xl">
              From URL to signal in three steps.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-0 md:grid-cols-3">
            {PIPELINE.map((item, i) => (
              <Reveal key={item.step} delay={i * 0.06}>
                <div
                  className={cn(
                    "relative h-full border-[var(--ln-line)] py-2 md:px-8 md:py-0",
                    i > 0 && "md:border-l",
                    i < PIPELINE.length - 1 && "mb-8 md:mb-0"
                  )}
                >
                  <p className="font-mono text-xs text-[var(--ln-faint)]">{item.step}</p>
                  <h3 className="mt-3 font-display text-xl font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ln-muted)]">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section className="border-y border-[var(--ln-line)] py-20 md:py-24">
        <div className="ln-container">
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <Eyebrow>Pricing</Eyebrow>
                <h2 className="mt-4 font-display text-3xl font-medium md:text-4xl">
                  Clear plans. No checkout theater.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ln-muted)]">
                  14-day trial. Upgrade from your dashboard when you&apos;re ready.
                </p>
              </div>
              <MarketingButton href="/pricing" variant="secondary">
                Compare plans
                <ArrowRight className="size-4" />
              </MarketingButton>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--ln-radius-lg)] border border-[var(--ln-line)] bg-[var(--ln-line)] md:grid-cols-3">
            {(["STARTER", "PRO", "AGENCY"] as const).map((tier, i) => (
              <Reveal key={tier} delay={i * 0.06} className="bg-[var(--ln-surface)] p-6 md:p-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-muted)]">
                  {PLAN_LABELS[tier]}
                </p>
                <p className="mt-4 font-display text-4xl font-medium">
                  ${PLAN_PRICES_USD[tier]}
                  <span className="ml-1 text-base font-normal text-[var(--ln-faint)]">/mo</span>
                </p>
                <p className="mt-3 text-sm text-[var(--ln-muted)]">
                  Up to {PLAN_SITE_LIMITS[tier]} websites
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="py-20 md:py-24">
        <div className="ln-container">
          <Reveal>
            <div className="relative overflow-hidden rounded-[var(--ln-radius-lg)] bg-[var(--ln-panel)] px-8 py-14 text-center md:px-16 md:py-16">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,122,111,0.22),transparent_55%)]" />
              <div className="relative">
                <p className="font-display text-3xl font-medium text-white md:text-4xl">
                  Build for everyone. Watch production.
                </p>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--ln-panel-muted)]">
                  Keep sites up, usable, and compliant — starting with your first audit.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <MarketingButton href={primaryHref} variant="panel">
                    {isLoggedIn ? "Open dashboard" : "Start free trial"}
                    <ArrowRight className="size-4" />
                  </MarketingButton>
                  <MarketingButton
                    href="/contact"
                    variant="ghost"
                    className="text-[var(--ln-panel-muted)] hover:text-white"
                  >
                    Talk to us
                  </MarketingButton>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
