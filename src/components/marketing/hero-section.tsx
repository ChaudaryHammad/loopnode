"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Activity, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <section className="relative w-full max-w-[88rem] mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-32 flex flex-col items-center">
      <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb,100,120,255),0.15),transparent_60%)]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center z-10"
      >
        {/* Text Content */}
        <div className="flex flex-col space-y-6 lg:pr-8">
          <motion.div variants={itemVariants}>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs py-1.5 px-3 rounded-full uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2 inline-block" />
              LoopNode Real-time Audits
            </Badge>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]"
          >
            Monitor website health <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              before users notice.
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg"
          >
            The all-in-one dashboard for Lighthouse performance, axe-core accessibility, SEO checks, and broken link crawling.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
            <ButtonLink
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="h-12 px-8 font-semibold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all uppercase tracking-wide text-sm"
            >
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="outline"
              className="h-12 px-8 font-semibold rounded-xl bg-background/50 backdrop-blur-sm uppercase tracking-wide text-sm"
            >
              View Pricing
            </ButtonLink>
          </motion.div>
        </div>

        {/* UI Dashboard Mockup */}
        <motion.div variants={itemVariants} className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square xl:aspect-[4/3] max-w-2xl mx-auto">
          {/* Decorative glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

          {/* Main Dashboard Card */}
          <div className="absolute inset-0 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Mockup Header */}
            <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-4 gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="mx-auto text-xs font-semibold text-muted-foreground uppercase tracking-wider">
               loopnode / dashboard
              </div>
            </div>

            {/* Mockup Body */}
            <div className="p-6 flex-1 flex flex-col gap-6 relative">
              {/* Top stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Performance", score: 98, color: "text-emerald-400", hex: "#34d399" },
                  { label: "Accessibility", score: 100, color: "text-emerald-400", hex: "#34d399" },
                  { label: "SEO", score: 92, color: "text-emerald-400", hex: "#34d399" },
                  { label: "Security", score: 100, color: "text-emerald-400", hex: "#34d399" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 flex flex-col items-center justify-center gap-3 relative overflow-hidden group hover:border-white/10 transition-colors">
                    {/* Fake ring */}
                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        {/* Background complete circle */}
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-white/10" />
                        {/* Progress circle */}
                        <circle cx="32" cy="32" r="28" stroke={stat.hex} strokeWidth="4" fill="none" className="opacity-80" strokeDasharray="175.93" strokeDashoffset={175.93 - (175.93 * stat.score) / 100} strokeLinecap="round" />
                      </svg>
                      <span className="text-xl font-bold">{stat.score}</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-widest text-center">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Chart mockup */}
              <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Core Web Vitals Trend</span>
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                </div>
                <div className="flex-1 flex items-end gap-2 px-2">
                  {[40, 60, 45, 80, 55, 90, 85, 100, 95].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1, type: "spring" }}
                      className="flex-1 bg-gradient-to-t from-primary/10 to-primary/60 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="absolute -bottom-6 -left-6 sm:-left-12 bg-card border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4 z-20"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Axe-Core Scan</div>
              <div className="text-sm font-bold text-foreground">0 Violations Found</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1, type: "spring" }}
            className="absolute -top-6 -right-6 sm:-right-8 bg-card border border-white/10 rounded-xl p-4 shadow-xl flex items-center gap-4 z-20"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">LCP Metric</div>
              <div className="text-sm font-bold text-foreground">1.2s (Fast)</div>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  );
}
