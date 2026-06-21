import React from "react";
import { Zap, Eye, Search, Shield, Link2, CheckSquare } from "lucide-react";

export const metadata = {
  title: "Features & Tools",
  description: "Examine our multi-dimensional website audit engine. Details on performance, accessibility, SEO, security and broken link scans.",
};

export default function FeaturesPage() {
  const auditModules = [
    {
      title: "Performance Audits",
      subtitle: "Powered by Lighthouse",
      description: "Analyze core performance indicators to optimize speed and user experiences.",
      icon: Zap,
      checks: [
        "First Contentful Paint (FCP)",
        "Largest Contentful Paint (LCP)",
        "Cumulative Layout Shift (CLS)",
        "Interaction to Next Paint (INP)",
        "Total Blocking Time (TBT)",
        "Audit resource sizes and bundle weights",
      ],
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Accessibility Scans",
      subtitle: "Powered by axe-core",
      description: "Detect usability bugs to guarantee a compliant experience for all users.",
      icon: Eye,
      checks: [
        "Color contrast ratios (WCAG 2 AA)",
        "Image alt text requirements",
        "Form labels and input associations",
        "Screen reader headings hierarchy",
        "Keyboard navigation compatibility",
        "Aria attribute syntax checks",
      ],
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "SEO Health Audits",
      subtitle: "Cheerio HTML Parser",
      description: "Inspect crawlabity configurations to improve your organic search ranking.",
      icon: Search,
      checks: [
        "Title and meta description lengths",
        "H1 presence and uniqueness",
        "Sitemap.xml existence and format",
        "Robots.txt parser check",
        "Open Graph (OG) tag validation",
        "Image alt keywords indexing",
      ],
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Security & Headers",
      subtitle: "Network Header Diagnostic",
      description: "Scan your security configurations to prevent vulnerabilities and exploits.",
      icon: Shield,
      checks: [
        "HTTPS connection enforcement",
        "HTTP Strict Transport Security (HSTS)",
        "Content Security Policy (CSP)",
        "X-Frame-Options (Clickjacking guard)",
        "X-Content-Type-Options (Mime sniff guard)",
        "SSL Certificate expiration checks",
      ],
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Broken Link Crawler",
      subtitle: "Asynchronous Site Spider",
      description: "Crawl anchor tags and images across directories to find dead links.",
      icon: Link2,
      checks: [
        "Detect 404 client error links",
        "Identify broken images and assets",
        "Flag redirect loops and chains (3+)",
        "Verify internal link directories",
        "Check external link status codes",
        "Low memory spider execution",
      ],
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 select-none">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          SaaS Auditing Features
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          HealthMonitor implements industry standard tooling to run deep audits. Offloaded to background queues so your UI never experiences lag.
        </p>
      </div>

      {/* Feature Blocks */}
      <div className="space-y-16">
        {auditModules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <div 
              key={idx}
              className={`flex flex-col lg:flex-row gap-10 items-center justify-between border-b border-border/20 pb-16 last:border-0 last:pb-0 ${
                idx % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Feature info */}
              <div className="flex-1 space-y-5 max-w-xl">
                <div className="space-y-1.5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${mod.color} text-xs font-semibold uppercase tracking-wider`}>
                    <Icon className="w-3.5 h-3.5" />
                    {mod.subtitle}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {mod.title}
                  </h2>
                </div>
                
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {mod.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {mod.checks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphic Placeholder (Premium Design) */}
              <div className="flex-1 w-full max-w-lg aspect-video rounded-3xl bg-gradient-to-br from-secondary/40 via-secondary/10 to-transparent border border-border/30 flex items-center justify-center p-6 relative overflow-hidden group hover:border-border/80 transition-all duration-300">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
                <Icon className="w-16 h-16 text-primary/45 group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
