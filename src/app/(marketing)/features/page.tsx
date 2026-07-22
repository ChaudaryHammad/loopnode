"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import {
  Eyebrow,
  MarketingButton,
  Reveal,
} from "@/components/marketing/primitives";
import { FeaturesHero } from "@/components/marketing/features-hero";
import { FeaturesIntelligenceSection } from "@/components/marketing/features-intelligence-section";
import { FeaturesReportsSection } from "@/components/marketing/features-reports-section";

const CAPABILITIES = [
  {
    title: "Uptime & SSL",
    body: "Availability, latency, and certificate expiry — watched on a schedule.",
  },
  {
    title: "Audits",
    body: "Performance, accessibility, SEO, and security scores from real engines.",
  },
  {
    title: "Coverage",
    body: "Crawl for broken pages, dead assets, and soft failures across the site.",
  },
] as const;

const FAQ = [
  {
    q: "Do audits use real engines?",
    a: "Yes. Performance runs Lighthouse in Chrome. Accessibility uses axe-core. Coverage crawls separately.",
  },
  {
    q: "Can it audit authenticated pages?",
    a: "Not yet — public URLs only. Authenticated flows are on the roadmap.",
  },
  {
    q: "How is coverage different from an audit?",
    a: "Coverage maps reachability. Audits score the quality of what loads.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex-1">
      <FeaturesHero />

      <FeaturesIntelligenceSection />

      <section className="border-b border-[var(--ln-line)] bg-[var(--ln-surface)] py-16 md:py-20">
        <div className="ln-container">
          <Reveal>
            <Eyebrow>Capabilities</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--ln-ink)] md:text-3xl">
              What it watches
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title}>
                <h3 className="text-sm font-medium text-[var(--ln-ink)]">
                  {cap.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ln-muted)]">
                  {cap.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FeaturesReportsSection />

      <section className="py-16 md:py-20">
        <div className="ln-container">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--ln-ink)]">
              FAQ
            </h2>
          </Reveal>
          <div className="mt-8 divide-y divide-[var(--ln-line)] border-y border-[var(--ln-line)]">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="grid gap-2 py-5 md:grid-cols-[0.9fr_1.1fr] md:gap-10"
              >
                <p className="text-sm font-medium text-[var(--ln-ink)]">{item.q}</p>
                <p className="text-sm leading-relaxed text-[var(--ln-muted)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="ln-container">
          <div className="rounded-[var(--ln-radius-lg)] bg-[var(--ln-panel)] px-8 py-12 text-center md:py-14">
            <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
              Put a site on the loop.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ln-panel-muted)]">
              Add a URL. Get ranked findings. Share a report when you need it.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/register" variant="panel">
                Start monitoring
                <ArrowRight className="size-4" />
              </MarketingButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
