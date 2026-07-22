"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SIGNALS = [
  "Performance",
  "Accessibility",
  "SEO",
  "Security",
  "Coverage",
  "Uptime",
  "SSL",
  "Core Web Vitals",
  "Broken Links",
  "Headers",
  "Redirects",
  "Metadata",
  "Structured Data",
  "Sitemap",
  "Robots.txt",
  "JavaScript Errors",
  "API Health",
  "Images",
  "Caching",
  "Best Practices",
  "DNS",
  "Response Time",
] as const;

function MarqueeTrack({
  items,
  reverse = false,
  duration = 40,
}: {
  items: readonly string[];
  reverse?: boolean;
  duration?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const loop = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className={cn("flex w-max gap-2.5 will-change-transform")}
        style={
          reducedMotion
            ? undefined
            : {
                animationName: reverse ? "ln-marquee-reverse" : "ln-marquee",
                animationDuration: `${duration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationPlayState: paused ? "paused" : "running",
              }
        }
      >
        {loop.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="inline-flex shrink-0 items-center rounded-full border border-[var(--ln-line-strong)] bg-[var(--ln-surface)]/90 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.04em] text-[var(--ln-ink-soft)] backdrop-blur-sm"
          >
            <span className="mr-2 size-1 rounded-full bg-[var(--ln-signal)] opacity-70" />
            {label}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--ln-bg)] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--ln-bg)] to-transparent sm:w-24" />
    </div>
  );
}

export function SignalMarquee({ className }: { className?: string }) {
  const mid = Math.ceil(SIGNALS.length / 2);

  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <MarqueeTrack items={SIGNALS.slice(0, mid)} duration={44} />
      <MarqueeTrack items={SIGNALS.slice(mid)} reverse duration={50} />
    </div>
  );
}
