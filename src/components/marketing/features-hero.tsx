"use client";

import React from "react";
import { Eyebrow, Reveal } from "@/components/marketing/primitives";

/** Minimal Features hero — type and space only. */
export function FeaturesHero() {
  return (
    <section className="ln-container pb-16 pt-20 md:pb-20 md:pt-28">
      <Reveal>
        <Eyebrow>Features</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-[var(--ln-ink)] md:text-5xl md:leading-[1.1]">
          Continuous site intelligence.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ln-muted)] md:text-lg">
          Crawl, classify, and rank what breaks — uptime, accessibility,
          security, SEO, and coverage — then turn it into work you can ship.
        </p>
      </Reveal>
    </section>
  );
}
