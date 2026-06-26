"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Zap,
  Eye,
  Search,
  Shield,
  Link2,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Activity,
  Code,
  Globe,
  Terminal,
  Network,
  FileDown,
  Target
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

// ─── Animation presets ────────────────────────────────────────────────────────
const VP = { once: true, margin: "-80px" };

const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 48, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 200, damping: 22, delay } },
});
const fadeLeft = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: -60, filter: "blur(4px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 180, damping: 22, delay } },
});
const fadeRight = (delay = 0): Variants => ({
  hidden: { opacity: 0, x: 60, filter: "blur(4px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 180, damping: 22, delay } },
});
const scaleIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.84, filter: "blur(6px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { type: "spring", stiffness: 240, damping: 24, delay } },
});
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 240, damping: 24 } },
};

const modules = [
  {
    id: "performance",
    label: "Performance",
    subtitle: "Lighthouse · Core Web Vitals",
    icon: Zap,
    accent: "#34d399",
    accentClass: "text-emerald-400",
    border: "border-emerald-400/20",
    bg: "from-emerald-400/10 to-transparent",
    description:
      "Every audit launches a real Chrome instance and runs Lighthouse against your URL. LoopNode captures LCP, INP, CLS, FCP, and TBT, rates each vital as Good, Needs work, or Poor, and lists every Lighthouse finding with severity and remediation guidance.",
    checks: [
      "Largest Contentful Paint (LCP)",
      "Interaction to Next Paint (INP)",
      "Cumulative Layout Shift (CLS)",
      "First Contentful Paint & Total Blocking Time",
      "Performance score with historical trends",
      "Per-finding recommendations from Lighthouse",
    ],
    renderMockup: () => (
      <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="w-24 h-24 text-emerald-400" />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="flex w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Vitals Trace</span>
          </div>
          <div className="text-3xl font-black text-emerald-400">98</div>
        </div>
        
        {/* Waterfall Chart Mockup */}
        <div className="space-y-4 relative z-10">
          {[
            { label: "FCP", time: "0.8s", width: "30%", color: "bg-emerald-400/80" },
            { label: "LCP", time: "1.2s", width: "45%", color: "bg-emerald-400" },
            { label: "TTI", time: "1.4s", width: "55%", color: "bg-emerald-500" },
            { label: "Load", time: "2.1s", width: "80%", color: "bg-emerald-600" }
          ].map((bar, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span>{bar.label}</span>
                <span>{bar.time}</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: bar.width }}
                  transition={{ duration: 1, delay: i * 0.2, type: "spring" }}
                  className={`h-full ${bar.color} rounded-full`} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "accessibility",
    label: "Accessibility",
    subtitle: "axe-core · WCAG 2.1",
    icon: Eye,
    accent: "#a78bfa",
    accentClass: "text-violet-400",
    border: "border-violet-400/20",
    bg: "from-violet-400/10 to-transparent",
    description:
      "Accessibility violations are detected in a real browser using axe-core. Issues are grouped by rule, ranked by impact (critical through minor), and include CSS selectors so developers can locate the exact element.",
    checks: [
      "WCAG 2 A / AA rule coverage",
      "Color contrast failures",
      "Missing form labels and alt text",
      "Keyboard navigation and focus traps",
      "Heading hierarchy violations",
      "ARIA attribute and role errors",
    ],
    renderMockup: () => (
      <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
        <div className="bg-[#1e1e1e] px-4 py-3 border-b border-white/5 flex items-center gap-2">
          <Code className="w-4 h-4 text-violet-400" />
          <span className="text-violet-400 font-bold uppercase tracking-widest text-[10px]">Violation Inspector</span>
        </div>
        <div className="p-5 bg-[#0d0d0d] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-rose-400 font-bold text-sm mb-1">color-contrast</div>
              <div className="text-muted-foreground text-[10px]">Elements must have sufficient color contrast</div>
            </div>
            <span className="bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Critical</span>
          </div>
          
          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
             <div className="text-muted-foreground/50 mb-2">// Target selector</div>
             <div className="text-blue-300 font-medium mb-3">.hero-section &gt; h1.subtext</div>
             <div className="text-muted-foreground/50 mb-2">// Failing HTML</div>
             <code className="text-rose-200 bg-rose-500/10 px-2 py-1 rounded block whitespace-pre-wrap">
               &lt;h1 class="subtext" style="color: #666; background: #555"&gt;<br/>
               &nbsp;&nbsp;Welcome to our site<br/>
               &lt;/h1&gt;
             </code>
          </div>
          <div className="flex items-center gap-2 text-violet-300 font-medium bg-violet-500/10 px-3 py-2 rounded">
            <CheckCircle2 className="w-4 h-4" />
            <span>Fix: Increase contrast ratio to 4.5:1</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "seo",
    label: "SEO",
    subtitle: "On-page · Technical SEO",
    icon: Search,
    accent: "#fbbf24",
    accentClass: "text-amber-400",
    border: "border-amber-400/20",
    bg: "from-amber-400/10 to-transparent",
    description:
      "LoopNode fetches your page HTML and validates the fundamentals search engines care about — plus live checks against robots.txt and sitemap.xml. The SEO report page shows a pass/warn/fail checklist you can refresh anytime.",
    checks: [
      "Title and meta description length",
      "H1 presence and uniqueness",
      "Open Graph tags for social sharing",
      "Canonical URL configuration",
      "robots.txt and sitemap.xml reachability",
      "Image alt text for indexable content",
    ],
    renderMockup: () => (
      <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
         <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-bold uppercase tracking-widest text-[10px]">SERP Preview & Checklist</span>
        </div>
        <div className="p-6 space-y-6">
          {/* SERP Preview */}
          <div className="bg-white/10 p-4 rounded-xl space-y-1 border border-white/5">
            <div className="text-[10px] text-muted-foreground mb-1">https://example.com &gt; products</div>
            <div className="text-blue-400 text-lg font-medium hover:underline cursor-pointer truncate">Acme Corp | Premium Developer Tools</div>
            <div className="text-sm text-foreground/80 line-clamp-2">Equip your team with the fastest, most reliable developer tools on the market. Start your 14-day free trial today.</div>
          </div>
          
          {/* Checklist */}
          <div className="space-y-3">
            {[
              { label: "Title Tag Length", val: "55 chars", status: "pass", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Meta Description", val: "115 chars", status: "pass", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Multiple H1 Tags", val: "Found 2", status: "fail", icon: ChevronDown, color: "text-rose-400" },
              { label: "Robots.txt", val: "Valid", status: "pass", icon: CheckCircle2, color: "text-emerald-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0">
                <span className="font-semibold text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px]">{item.val}</span>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "security",
    label: "Security",
    subtitle: "Live HTTP · CSP Grading",
    icon: Shield,
    accent: "#f87171",
    accentClass: "text-rose-400",
    border: "border-rose-400/20",
    bg: "from-rose-400/10 to-transparent",
    description:
      "Security audits fetch live response headers and evaluate HTTPS, HSTS, CSP, X-Frame-Options, and more. Your Content-Security-Policy is parsed, graded A–F, and accompanied by getting-started, intermediate, and advanced hardening recommendations.",
    checks: [
      "HTTPS enforcement check",
      "HSTS configuration strength",
      "CSP directive parsing and letter grade",
      "X-Frame-Options / frame-ancestors",
      "X-Content-Type-Options and Referrer-Policy",
      "Tiered CSP improvement recommendations",
    ],
    renderMockup: () => (
      <div className="bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        <div className="bg-[#111] px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-rose-400" />
          <span className="text-rose-400 font-bold tracking-widest text-[10px]">bash - HTTP Headers</span>
        </div>
        <div className="p-5 text-emerald-400/90 leading-relaxed overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            <div className="text-white/50 mb-2">$ curl -I https://secure-site.com</div>
            <div className="mb-1">HTTP/2 200</div>
            <div className="mb-1 text-white">server: <span className="text-blue-300">cloudflare</span></div>
            <div className="mb-1 text-white">strict-transport-security: <span className="text-amber-300">max-age=31536000; includeSubDomains</span></div>
            <div className="mb-1 text-white">x-content-type-options: <span className="text-amber-300">nosniff</span></div>
            <div className="mb-1 text-white">x-frame-options: <span className="text-amber-300">DENY</span></div>
            <div className="mb-3 text-white flex">
              content-security-policy:&nbsp;
              <span className="text-rose-300 line-clamp-2">
                default-src 'self'; script-src 'self' https://trusted.com; object-src 'none';
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-dashed border-white/20">
               <div className="flex items-center gap-4">
                 <div className="text-4xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">A+</div>
                 <div>
                   <div className="text-white font-bold text-sm">CSP Grade: Excellent</div>
                   <div className="text-white/50 text-[10px] mt-1">All critical directives are securely configured.</div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: "broken-links",
    label: "Broken Links",
    subtitle: "Deep Crawler · BFS",
    icon: Link2,
    accent: "#60a5fa",
    accentClass: "text-blue-400",
    border: "border-blue-400/20",
    bg: "from-blue-400/10 to-transparent",
    description:
      "Broken links are checked outside the main audit so you can run full internal crawls or external outbound checks on demand. See progress live, filter by link type, copy broken URLs, and view the source page and DOM element for every failure.",
    checks: [
      "Internal site-wide crawl (all levels)",
      "External outbound link verification",
      "Filter by pages, images, scripts, stylesheets",
      "HTTP status codes and error details",
      "Source page URL and element selector",
      "Halt scan anytime with progress tracking",
    ],
    renderMockup: () => (
      <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-bold uppercase tracking-widest text-[10px]">Crawl Results</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">4 Dead Links</span>
        </div>
        
        <div className="p-4 space-y-3 relative z-10">
           {[
             { url: "/assets/old-logo.png", status: "404 Not Found", source: "/about", type: "Image" },
             { url: "https://twitter.com/oldhandle", status: "404 Not Found", source: "/contact", type: "External" },
             { url: "/api/v1/legacy-endpoint", status: "500 Internal Error", source: "/docs", type: "Internal" },
           ].map((link, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.15 }}
               className="bg-card/80 border border-white/5 rounded-xl p-3 flex flex-col gap-2 hover:border-white/10 transition-colors"
             >
               <div className="flex justify-between items-start">
                 <div className="text-rose-400 font-medium text-xs truncate max-w-[200px]">{link.url}</div>
                 <div className="text-[10px] font-bold text-muted-foreground uppercase">{link.type}</div>
               </div>
               <div className="flex justify-between items-end">
                 <div>
                   <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Found on</div>
                   <div className="text-blue-300 text-xs">{link.source}</div>
                 </div>
                 <div className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                   {link.status}
                 </div>
               </div>
             </motion.div>
           ))}
        </div>
        {/* Subtle background nodes decoration */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96, 165, 250, 0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      </div>
    ),
  },
  {
    id: "reporting",
    label: "Reporting",
    subtitle: "CSV · PDF Exports",
    icon: FileDown,
    accent: "#f472b6",
    accentClass: "text-pink-400",
    border: "border-pink-400/20",
    bg: "from-pink-400/10 to-transparent",
    description:
      "Generate instant, white-labeled reports for stakeholders or clients. Export raw data as CSV for your own analysis or download beautifully formatted PDF summaries of any audit instantly.",
    checks: [
      "One-click PDF generation",
      "Raw CSV data exports",
      "White-label branding options",
      "Executive summaries",
      "Shareable public links",
      "Automated email reports",
    ],
    renderMockup: () => (
      <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
         <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
               <FileDown className="w-5 h-5 text-pink-400" />
             </div>
             <div>
               <div className="text-sm font-bold text-foreground">Audit Report</div>
               <div className="text-xs text-muted-foreground">Generated Today</div>
             </div>
           </div>
           <div className="flex gap-2">
             <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors cursor-pointer">CSV</div>
             <div className="px-3 py-1.5 rounded bg-pink-500/20 border border-pink-500/30 text-pink-400 text-[10px] font-bold uppercase tracking-widest hover:bg-pink-500/30 transition-colors cursor-pointer">PDF</div>
           </div>
         </div>
         <div className="space-y-4">
           {/* Fake PDF preview */}
           <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
              <div className="w-16 h-20 bg-white/10 rounded border border-white/5 flex items-center justify-center shrink-0">
                 <div className="w-8 h-10 bg-white/5 rounded-sm shadow-sm" />
              </div>
              <div className="flex-1 space-y-2 py-1">
                 <div className="w-3/4 h-2.5 bg-white/20 rounded-full" />
                 <div className="w-1/2 h-2 bg-white/10 rounded-full" />
                 <div className="w-full h-1.5 bg-white/5 rounded-full mt-4" />
                 <div className="w-5/6 h-1.5 bg-white/5 rounded-full" />
              </div>
           </div>
         </div>
      </div>
    ),
  },
  {
    id: "issues",
    label: "Issues Center",
    subtitle: "Triage · Tracking",
    icon: Target,
    accent: "#c084fc",
    accentClass: "text-purple-400",
    border: "border-purple-400/20",
    bg: "from-purple-400/10 to-transparent",
    description:
      "All failing checks flow into a unified Issues Center. Track regressions, assign priorities, and watch issues automatically resolve themselves upon your next successful deploy.",
    checks: [
      "Unified failure dashboard",
      "Automatic issue resolution",
      "Severity-based prioritization",
      "Historical fix tracking",
      "Direct links to failing elements",
      "Ignore or snooze false positives",
    ],
    renderMockup: () => (
      <div className="bg-card/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1 relative">
         <div className="bg-[#111] rounded-xl border border-white/5 p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Issues</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">12 Open</span>
            </div>
            {[
              { title: "Missing alt text on hero image", tag: "A11y", color: "text-violet-400", bg: "bg-violet-400/10" },
              { title: "LCP exceeds 2.5s on mobile", tag: "Perf", color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { title: "Missing HSTS header", tag: "Sec", color: "text-rose-400", bg: "bg-rose-400/10" }
            ].map((issue, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${issue.color.replace('text', 'bg')}`} />
                  <span className="text-sm font-medium">{issue.title}</span>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold ${issue.color} ${issue.bg}`}>
                  {issue.tag}
                </div>
              </div>
            ))}
         </div>
      </div>
    ),
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 240, damping: 22 } },
};

export default function FeaturesPage() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col">
      {/* ── HERO ── */}
      <section className="relative w-full max-w-[88rem] mx-auto px-6 py-20 md:py-28 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb,100,120,255),0.12),transparent_60%)] pointer-events-none" />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 space-y-5 max-w-3xl mx-auto"
        >
          <motion.div variants={staggerChild}
            className="inline-block bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(var(--primary-rgb,100,120,255),0.4)]">
            What LoopNode audits
          </motion.div>
          <motion.h1 variants={staggerChild} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Five engines. One dashboard. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400">
              Every failure surfaced.
            </span>
          </motion.h1>
          <motion.p variants={staggerChild} className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-6">
            Industry-standard tools automated for your workflow. Each category has its own report page with scores, live checks, and filterable issues.
          </motion.p>
        </motion.div>
      </section>

      {/* ── MODULE TABS ── */}
      <section className="w-full border-t border-white/5 bg-[#050505] sticky top-16 z-30 overflow-hidden">
        <div className="max-w-[88rem] mx-auto px-4 sm:px-6">
          <div
            className="flex gap-1 py-3 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <a
                  key={mod.id}
                  href={`#${mod.id}`}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all shrink-0 whitespace-nowrap ${mod.accentClass} hover:bg-white/5`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline sm:inline">{mod.label}</span>
                  <span className="sm:hidden">{mod.label.split(" ")[0]}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>


      {/* ── MODULE SECTIONS ── */}
      <div className="w-full">
        {modules.map((mod, idx) => {
          const Icon = mod.icon;
          const isOdd = idx % 2 === 1;
          const textVariants = isOdd ? fadeRight(0) : fadeLeft(0);
          const mockupVariants = isOdd ? fadeLeft(0.12) : fadeRight(0.12);
          return (
            <section
              key={mod.id}
              id={mod.id}
              className={`w-full border-t border-white/5 ${isOdd ? "" : "bg-[#050505]"} scroll-mt-28 overflow-hidden`}
            >
              <div className={`max-w-[88rem] mx-auto px-6 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center`}>
                {/* Text side */}
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VP}
                  className={`space-y-8 ${isOdd ? "lg:order-2" : ""}`}
                >
                  <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={VP}
                    className="flex items-center gap-4">
                    <motion.div variants={scaleIn(0)} className={`flex items-center justify-center w-14 h-14 rounded-2xl border ${mod.border} bg-gradient-to-br ${mod.bg} ${mod.accentClass} shadow-xl`}>
                      <Icon className="w-6 h-6" />
                    </motion.div>
                    <motion.div variants={staggerChild}>
                      <div className={`text-sm font-bold uppercase tracking-widest ${mod.accentClass}`}>{mod.subtitle}</div>
                    </motion.div>
                  </motion.div>

                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
                    {mod.label} <span className="text-muted-foreground font-medium">audits</span>
                  </h2>

                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {mod.description}
                  </p>

                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={VP}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
                  >
                    {mod.checks.map((check, i) => (
                      <motion.div key={i} variants={staggerChild} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${mod.accentClass}`} />
                        <span className="text-sm text-foreground/80 leading-relaxed font-medium">{check}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Custom Mockup Side */}
                <motion.div
                  variants={mockupVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VP}
                  className={`${isOdd ? "lg:order-1" : ""} relative`}
                >
                  <div 
                    className="absolute inset-0 -z-10 scale-125 blur-3xl rounded-full opacity-20" 
                    style={{ background: `radial-gradient(circle at center, ${mod.accent}, transparent 60%)` }} 
                  />
                  {mod.renderMockup()}
                </motion.div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── FAQ ── */}
      <section className="w-full border-t border-white/5 bg-[#050505]">
        <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="text-center mb-16 space-y-4"
          >
            <motion.div variants={scaleIn(0.05)} initial="hidden" whileInView="visible" viewport={VP}
              className="inline-block bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              FAQ
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Common questions</h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {[
              {
                q: "Do you run real Lighthouse or simulate scores?",
                a: "Real. Every audit spins up a headless Chrome instance and runs the official Lighthouse library against your URL. There is no score simulation.",
              },
              {
                q: "How long does a full audit take?",
                a: "Typically 30–90 seconds for a standard page. Performance (Lighthouse) is the slowest component; accessibility, SEO, and security checks run in parallel and complete in seconds.",
              },
              {
                q: "Can I audit pages behind a login?",
                a: "Not yet — LoopNode currently audits publicly accessible URLs. Authenticated page support is on the roadmap for a future release.",
              },
              {
                q: "Is the broken link checker part of the main audit?",
                a: "No — it runs separately so you can trigger it independently and control crawl depth. This prevents the main audit from timing out on large sites.",
              },
            ].map((faq, i) => (
              <motion.div key={i} variants={itemVariants}>
                <button
                  onClick={() => setActive(active === String(i) ? null : String(i))}
                  className="w-full flex items-center justify-between text-left gap-4 p-6 bg-card/40 border border-white/8 rounded-2xl hover:border-white/20 hover:bg-card/60 transition-all group"
                >
                  <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${active === String(i) ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {active === String(i) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 text-base text-muted-foreground leading-relaxed border-x border-b border-white/8 rounded-b-2xl -mt-2 bg-card/20">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full border-t border-white/5 max-w-[88rem] mx-auto px-6 py-24 md:py-32">
        <motion.div
          variants={scaleIn(0)}
          initial="hidden"
          whileInView="visible"
          viewport={VP}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] p-10 md:p-24 text-center shadow-2xl"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VP}
            className="relative z-10 max-w-3xl mx-auto space-y-8"
          >
            <motion.h2 variants={staggerChild} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Ready to run your first audit?
            </motion.h2>
            <motion.p variants={staggerChild} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Connect a site and see real Lighthouse, axe-core, and security results in under a minute. No card required.
            </motion.p>
            <motion.div variants={staggerChild} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <ButtonLink href="/register" className="w-full sm:w-auto h-14 px-10 text-sm font-bold rounded-xl uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(var(--primary-rgb,100,120,255),0.5)] hover:shadow-[0_0_60px_-10px_rgba(var(--primary-rgb,100,120,255),0.7)] transition-shadow">
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" className="w-full sm:w-auto h-14 px-10 text-sm font-bold bg-transparent border-white/10 hover:bg-white/5 hover:border-white/20 rounded-xl uppercase tracking-widest">
                View Pricing
              </ButtonLink>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
