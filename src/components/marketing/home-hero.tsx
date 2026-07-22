"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LiveMonitorCanvas } from "@/components/marketing/live-monitor-canvas";
import { MarketingButton } from "@/components/marketing/primitives";

const HeroShaderBg = dynamic(
  () =>
    import("@/components/marketing/hero-shader-bg").then((m) => m.HeroShaderBg),
  {
    ssr: false,
    loading: () => <div className="ln-hero-mesh" aria-hidden />,
  }
);

export function HomeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  const primaryHref = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel = isLoggedIn ? "Open dashboard" : "Start monitoring";

  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      <HeroShaderBg />
      <div className="absolute inset-0 ln-grid-bg opacity-25" />

      <div className="relative ln-container pt-16 pb-12 md:pt-24 md:pb-16">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl font-semibold tracking-tight text-[var(--ln-ink)] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
        >
          Health Mesh
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-3xl font-display text-3xl font-medium leading-[1.1] text-[var(--ln-ink-soft)] sm:text-4xl md:text-5xl"
        >
          Know before your users do.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ln-muted)] md:text-lg"
        >
          Continuous monitoring for downtime, accessibility, SSL, and production
          health — so your product stays up and usable for everyone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <MarketingButton href={primaryHref}>
            {primaryLabel}
            <ArrowRight className="size-4" />
          </MarketingButton>
          <MarketingButton href="/pricing" variant="secondary">
            View pricing
          </MarketingButton>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <LiveMonitorCanvas />
      </motion.div>
    </section>
  );
}
