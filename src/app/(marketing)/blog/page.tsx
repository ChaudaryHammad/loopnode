"use client";

import React from "react";
import Link from "next/link";
import { Calendar, Clock, Zap, Eye, Shield, Search, BarChart3, Link2 } from "lucide-react";
import { blogPosts, BlogPost } from "@/lib/marketing/blog-posts";
import { motion } from "framer-motion";

// ─── Category visual config ────────────────────────────────────────────────
const categoryConfig: Record<
  string,
  {
    icon: React.ElementType;
    accent: string;
    accentRgb: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    gradFrom: string;
    gradTo: string;
    visual: React.ReactNode;
  }
> = {
  Performance: {
    icon: Zap,
    accent: "#34d399",
    accentRgb: "52,211,153",
    textClass: "text-emerald-400",
    bgClass: "bg-emerald-400/10",
    borderClass: "border-emerald-400/20",
    gradFrom: "from-emerald-500/25",
    gradTo: "to-emerald-900/10",
    visual: <PerformanceVisual />,
  },
  Accessibility: {
    icon: Eye,
    accent: "#a78bfa",
    accentRgb: "167,139,250",
    textClass: "text-violet-400",
    bgClass: "bg-violet-400/10",
    borderClass: "border-violet-400/20",
    gradFrom: "from-violet-500/25",
    gradTo: "to-violet-900/10",
    visual: <AccessibilityVisual />,
  },
  Security: {
    icon: Shield,
    accent: "#f87171",
    accentRgb: "248,113,113",
    textClass: "text-rose-400",
    bgClass: "bg-rose-400/10",
    borderClass: "border-rose-400/20",
    gradFrom: "from-rose-500/25",
    gradTo: "to-rose-900/10",
    visual: <SecurityVisual />,
  },
  SEO: {
    icon: Search,
    accent: "#fbbf24",
    accentRgb: "251,191,36",
    textClass: "text-amber-400",
    bgClass: "bg-amber-400/10",
    borderClass: "border-amber-400/20",
    gradFrom: "from-amber-500/25",
    gradTo: "to-amber-900/10",
    visual: <SEOVisual />,
  },
  Trends: {
    icon: BarChart3,
    accent: "#22d3ee",
    accentRgb: "34,211,238",
    textClass: "text-cyan-400",
    bgClass: "bg-cyan-400/10",
    borderClass: "border-cyan-400/20",
    gradFrom: "from-cyan-500/25",
    gradTo: "to-cyan-900/10",
    visual: null,
  },
  Links: {
    icon: Link2,
    accent: "#60a5fa",
    accentRgb: "96,165,250",
    textClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    borderClass: "border-blue-400/20",
    gradFrom: "from-blue-500/25",
    gradTo: "to-blue-900/10",
    visual: null,
  },
};

// Fallback for unknown categories
const defaultConfig = {
  icon: BarChart3,
  accent: "#6366f1",
  accentRgb: "99,102,241",
  textClass: "text-indigo-400",
  bgClass: "bg-indigo-400/10",
  borderClass: "border-indigo-400/20",
  gradFrom: "from-indigo-500/25",
  gradTo: "to-indigo-900/10",
  visual: null,
};

function getCategoryConfig(category: string) {
  return categoryConfig[category] ?? defaultConfig;
}

// ─── Inline card visuals ───────────────────────────────────────────────────

function PerformanceVisual() {
  // Animated bar chart + score
  const bars = [55, 72, 68, 85, 78, 94];
  return (
    <div className="flex items-end gap-1.5 h-full w-full px-3 pb-3 pt-6 justify-center">
      {bars.map((h, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${h * 0.5}%`,
              background:
                i === bars.length - 1
                  ? "rgba(52,211,153,0.9)"
                  : "rgba(52,211,153,0.25)",
              minHeight: "4px",
            }}
          />
        </div>
      ))}
      <div className="absolute top-4 right-4 text-2xl font-black text-emerald-400 tabular-nums">
        94
      </div>
    </div>
  );
}

function AccessibilityVisual() {
  const checks = [
    { label: "Contrast", pass: true },
    { label: "Alt text", pass: true },
    { label: "ARIA labels", pass: true },
    { label: "Focus order", pass: false },
  ];
  return (
    <div className="flex flex-col gap-2 px-4 py-4 w-full h-full justify-center">
      {checks.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] font-medium">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
              c.pass ? "bg-emerald-400/20 text-emerald-400" : "bg-rose-400/20 text-rose-400"
            }`}
          >
            {c.pass ? "✓" : "✗"}
          </div>
          <span className={c.pass ? "text-foreground/70" : "text-rose-400/80"}>{c.label}</span>
          <div className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${c.pass ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}>
            {c.pass ? "PASS" : "FAIL"}
          </div>
        </div>
      ))}
    </div>
  );
}

function SecurityVisual() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2">
      {/* Shield icon with grade */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center">
          <Shield className="w-8 h-8 text-rose-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-400 flex items-center justify-center text-[11px] font-black text-white shadow-lg">
          A
        </div>
      </div>
      <div className="flex gap-1.5 mt-1">
        {["HSTS", "CSP", "X-FO"].map((h, i) => (
          <span key={i} className="text-[9px] font-bold text-rose-400 bg-rose-400/10 border border-rose-400/20 px-1.5 py-0.5 rounded">
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

function SEOVisual() {
  const rows = [
    { k: "Title", v: "✓ 58 chars" },
    { k: "Meta desc", v: "✓ 152 chars" },
    { k: "og:image", v: "✓ set" },
    { k: "Canonical", v: "✓ set" },
  ];
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 w-full h-full justify-center">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium">{r.k}</span>
          <span className="text-emerald-400 font-bold">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Blog card ─────────────────────────────────────────────────────────────

function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const cfg = getCategoryConfig(post.category);
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, type: "spring", delay: 0.1 + index * 0.08 }}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full group">
        <div className="h-full flex flex-col bg-card/60 backdrop-blur-xl border border-white/10 hover:border-white/25 rounded-3xl overflow-hidden transition-all duration-400 shadow-xl relative hover:shadow-2xl hover:-translate-y-1">

          {/* Visual header */}
          <div className="h-44 w-full relative overflow-hidden bg-black/60 border-b border-white/5 shrink-0">
            {/* Gradient wash */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradFrom} ${cfg.gradTo} opacity-70 group-hover:opacity-90 transition-opacity duration-500`} />

            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Ambient blob */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[60px] opacity-40 group-hover:opacity-70 transition-opacity duration-500"
              style={{ background: cfg.accent }}
            />

            {/* Content-aware visual */}
            <div className="absolute inset-0">{cfg.visual}</div>

            {/* Category chip — top left */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border backdrop-blur-md ${cfg.textClass} ${cfg.bgClass} ${cfg.borderClass}`}
              >
                <Icon className="w-3 h-3" />
                {post.category}
              </span>
            </div>
          </div>

          {/* Text body */}
          <div className="p-7 flex flex-col flex-1">
            <h2 className="text-lg font-bold leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h2>

            <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6 flex-1 line-clamp-3">
              {post.description}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/8 font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </span>
              </div>
              <span className={`font-bold ${cfg.textClass} opacity-0 group-hover:opacity-100 transition-opacity text-[11px] uppercase tracking-wider`}>
                Read →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BlogPage() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-[88rem] mx-auto px-6 py-20 md:py-28 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-5"
        >
          <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(var(--primary-rgb,100,120,255),0.4)]">
            Resources &amp; Guides
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Engineering{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
              Web Health
            </span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mt-4 max-w-xl mx-auto">
            In-depth guides on performance, accessibility, SEO, and security — written for
            developers who ship and monitor real sites.
          </p>
        </motion.div>

        {/* Uniform card grid — all posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {blogPosts.map((post, i) => (
            <BlogCard key={post.slug} post={post} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
