"use client";

import React from "react";
import { Eyebrow, Reveal } from "@/components/marketing/primitives";
import { SignalMarquee } from "@/components/marketing/signal-marquee";
import { IssueIntelligence } from "@/components/marketing/issue-intelligence";

export function FeaturesIntelligenceSection() {
  return (
    <section className="border-y border-[var(--ln-line)] py-16 md:py-20">
      <div className="ln-container">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold tracking-tight text-[var(--ln-ink)] md:text-3xl">
            Findings in. Decisions out.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--ln-muted)] md:text-base">
            Health Mesh discovers issues across the site, classifies them, and
            ranks what to fix next.
          </p>
        </Reveal>
      </div>

      <div className="mt-8 md:mt-10">
        <SignalMarquee />
      </div>

      <div className="ln-container mt-8 md:mt-10">
        <IssueIntelligence />
      </div>
    </section>
  );
}
