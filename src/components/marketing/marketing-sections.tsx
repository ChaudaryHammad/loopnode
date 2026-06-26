"use client";

import React from "react";
import { motion, Variants, useInView } from "framer-motion";
import {
  Zap, Eye, Search, Shield, Link2, BarChart3,
  ArrowRight, MousePointerClick, MonitorCheck, ServerCog,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

// ─── Shared animation presets ─────────────────────────────────────────────────

const VIEWPORT = { once: true, margin: "-80px" };

/** Fade + rise from below */
const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 48, filter: "blur(6px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 22, delay },
  },
});

/** Slide in from left */
const fadeLeft = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: -56, filter: "blur(4px)" },
  visible: {
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 180, damping: 22, delay },
  },
});

/** Slide in from right */
const fadeRight = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: 56, filter: "blur(4px)" },
  visible: {
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 180, damping: 22, delay },
  },
});

/** Scale up from center */
const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.82, filter: "blur(6px)" },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 240, damping: 24, delay },
  },
});

/** Staggered container */
const stagger = (staggerDelay = 0.08): Variants => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: staggerDelay } },
});

/** Child for staggered lists */
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    title: "Performance",
    description: "Real Lighthouse runs measuring LCP, INP, CLS, FCP, TBT with Good/Poor ratings and waterfall breakdowns.",
    icon: Zap,
    accent: "#34d399", accentRgb: "52,211,153",
    accentClass: "text-emerald-400", borderClass: "border-emerald-400/20",
    bgClass: "bg-emerald-400/5", glowClass: "from-emerald-500/20", size: "lg",
  },
  {
    title: "Accessibility",
    description: "axe-core WCAG 2.1 checks in a real browser with CSS selectors for every violation.",
    icon: Eye,
    accent: "#a78bfa", accentRgb: "167,139,250",
    accentClass: "text-violet-400", borderClass: "border-violet-400/20",
    bgClass: "bg-violet-400/5", glowClass: "from-violet-500/20", size: "md",
  },
  {
    title: "SEO Health",
    description: "Title tags, meta, Open Graph, canonical, robots.txt and sitemap reachability.",
    icon: Search,
    accent: "#fbbf24", accentRgb: "251,191,36",
    accentClass: "text-amber-400", borderClass: "border-amber-400/20",
    bgClass: "bg-amber-400/5", glowClass: "from-amber-500/20", size: "md",
  },
  {
    title: "Security & CSP",
    description: "Live HTTP header analysis, HSTS, X-Frame-Options and an A–F CSP grade.",
    icon: Shield,
    accent: "#f87171", accentRgb: "248,113,113",
    accentClass: "text-rose-400", borderClass: "border-rose-400/20",
    bgClass: "bg-rose-400/5", glowClass: "from-rose-500/20", size: "md",
  },
  {
    title: "Broken Links",
    description: "Deep BFS crawler for internal and external links — finds 404s and dead assets across your entire site.",
    icon: Link2,
    accent: "#60a5fa", accentRgb: "96,165,250",
    accentClass: "text-blue-400", borderClass: "border-blue-400/20",
    bgClass: "bg-blue-400/5", glowClass: "from-blue-500/20", size: "md",
  },
  {
    title: "Score Trends",
    description: "Historical data across every audit lets you pinpoint exactly which deploy broke your scores.",
    icon: BarChart3,
    accent: "#22d3ee", accentRgb: "34,211,238",
    accentClass: "text-cyan-400", borderClass: "border-cyan-400/20",
    bgClass: "bg-cyan-400/5", glowClass: "from-cyan-500/20", size: "lg",
  },
];

const steps = [
  { icon: MousePointerClick, step: "01", title: "Connect your site", description: "Add any public URL. LoopNode validates the connection instantly." },
  { icon: ServerCog, step: "02", title: "Run a full audit", description: "One click triggers Lighthouse, axe-core, and security checks in the cloud." },
  { icon: MonitorCheck, step: "03", title: "Fix with confidence", description: "Detailed findings, severity ratings, and actionable recommendations per issue." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SparklineSVG({ color }: { color: string }) {
  const pts = [18, 32, 22, 38, 28, 42, 34, 30, 45, 38, 52];
  const w = 120, h = 56;
  const max = Math.max(...pts), min = Math.min(...pts);
  const norm = pts.map((v) => ((v - min) / (max - min)) * (h - 8) + 4);
  const pathD = pts.map((_, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${h - norm[i]}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="opacity-80">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L${w},${h} L0,${h} Z`} fill="url(#spark-fill)" />
      <path d={pathD} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((_, i) => i === pts.length - 1 ? (
        <circle key={i} cx={(i / (pts.length - 1)) * w} cy={h - norm[i]} r="3.5" fill={color} />
      ) : null)}
    </svg>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
      <circle cx="36" cy="36" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
      <circle cx="36" cy="36" r={r} stroke={color} strokeWidth="6" fill="none"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketingSections({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div>
      {/* ── SIX ENGINES ────────────────────────────────────────────────────── */}
      <section className="relative w-full max-w-[88rem] mx-auto px-6 py-20 md:py-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Section header — clip-path wipe from bottom */}
        <motion.div
          variants={fadeUp(0)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <motion.div variants={scaleIn(0.05)} initial="hidden" whileInView="visible" viewport={VIEWPORT}
            className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(var(--primary-rgb,100,120,255),0.4)]">
            Audit Engines
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            Six engines.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-400 to-cyan-400">
              One unified dashboard.
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Industry-standard tools automated and stitched into a single audit pipeline —
            each engine with its own deep-dive report page.
          </p>
        </motion.div>

        {/* Bento grid — staggered cascade */}
        <motion.div
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-auto gap-4"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const isLarge = feature.size === "lg";
            return (
              <motion.div
                key={idx}
                variants={staggerChild}
                className={`group relative overflow-hidden rounded-3xl border ${feature.borderClass} ${feature.bgClass} backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl`}
                whileHover={{ boxShadow: `0 0 60px -10px rgba(${feature.accentRgb},0.28)` }}
              >
                <div className={`absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${feature.glowClass} to-transparent`} />
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

                <div className={`relative z-10 p-7 flex flex-col gap-5 ${isLarge ? "min-h-[220px]" : "min-h-[180px]"}`}>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${feature.borderClass} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                      style={{ background: `rgba(${feature.accentRgb},0.12)` }}>
                      <Icon className={`w-5 h-5 ${feature.accentClass}`} />
                    </div>
                    {feature.title === "Performance" && (
                      <div className="relative">
                        <ScoreRing score={96} color={feature.accent} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-sm font-black ${feature.accentClass}`}>96</span>
                        </div>
                      </div>
                    )}
                    {feature.title === "Score Trends" && <SparklineSVG color={feature.accent} />}
                    {feature.title === "Accessibility" && (
                      <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {["AA ✓", "AA ✓", "A ✓"].map((l, i) => (
                          <div key={i} className={`text-[10px] font-bold ${feature.accentClass} bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20`}>{l}</div>
                        ))}
                      </div>
                    )}
                    {feature.title === "SEO Health" && (
                      <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity text-right">
                        {[["Meta", "✓"], ["OG", "✓"], ["Sitemap", "!"]].map(([k, v], i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span className="text-muted-foreground">{k}</span>
                            <span className={v === "✓" ? "text-emerald-400" : "text-amber-400"}>{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {feature.title === "Security & CSP" && (
                      <div className={`text-3xl font-black ${feature.accentClass} opacity-70 group-hover:opacity-100 transition-opacity tabular-nums`}>
                        A<span className="text-lg text-muted-foreground">+</span>
                      </div>
                    )}
                    {feature.title === "Broken Links" && (
                      <div className="flex flex-col items-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-emerald-400 font-bold">1,204 OK</span>
                        <span className="text-[10px] text-rose-400 font-bold">3 broken</span>
                        <div className="w-16 h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: "97%" }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto">
                    <h3 className={`text-base font-bold tracking-tight mb-1.5 ${feature.accentClass}`}>{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA button — fade up after grid */}
        <motion.div
          variants={fadeUp(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="text-center mt-12"
        >
          <ButtonLink href="/features" variant="outline"
            className="bg-transparent border-white/15 hover:border-white/30 hover:bg-white/5 rounded-full px-7 h-11 text-xs font-bold uppercase tracking-widest transition-all">
            Explore all capabilities
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </ButtonLink>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="w-full border-t border-white/5 bg-[#050505]">
        <div className="max-w-[88rem] mx-auto px-6 py-20 md:py-24">
          {/* Label + headline — slide up with blur */}
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="text-center max-w-xl mx-auto mb-14 space-y-3"
          >
            <motion.div variants={scaleIn(0.05)} initial="hidden" whileInView="visible" viewport={VIEWPORT}
              className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">
              Workflow
            </motion.div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">Zero config. Maximum insight.</h2>
          </motion.div>

          {/* Steps — each slides from alternating directions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              // Alternate: left, up, right
              const variants = idx === 0 ? fadeLeft(0) : idx === 1 ? fadeUp(0.1) : fadeRight(0.2);
              return (
                <motion.div
                  key={idx}
                  variants={variants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                  whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  className="group bg-card/30 hover:bg-card/60 border border-white/8 hover:border-white/20 rounded-2xl p-7 transition-colors"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="text-4xl font-black text-white/8 select-none">{item.step}</div>
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5" />
                    </motion.div>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="w-full border-t border-white/5 max-w-[88rem] mx-auto px-6 py-20 md:py-24">
        <motion.div
          variants={scaleIn(0)}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 md:p-20 text-center"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="relative z-10 max-w-2xl mx-auto space-y-7"
          >
            <motion.h2 variants={fadeUp(0)} className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Ship healthier sites,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                starting today.
              </span>
            </motion.h2>
            <motion.p variants={fadeUp(0.05)} className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Thousands of developers rely on LoopNode to catch performance regressions,
              accessibility failures, and broken links before their users do.
            </motion.p>
            <motion.div variants={fadeUp(0.1)} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <ButtonLink
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="w-full sm:w-auto h-12 px-8 text-sm font-bold rounded-xl uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(var(--primary-rgb,100,120,255),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary-rgb,100,120,255),0.7)] transition-shadow"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </ButtonLink>
              <ButtonLink
                href="/pricing"
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-sm font-bold bg-transparent border-white/10 hover:bg-white/5 hover:border-white/20 rounded-xl uppercase tracking-widest"
              >
                View Pricing
              </ButtonLink>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
