import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { 
  Zap, 
  Eye, 
  Search, 
  ShieldAlert, 
  Link2, 
  CheckCircle2, 
  ArrowRight, 
  Gauge, 
  Star 
} from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const features = [
    {
      title: "Performance Audits",
      description: "Measure Core Web Vitals including FCP, LCP, CLS, and TBT. Get actionable warnings and recommendations to optimize speed.",
      icon: Zap,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Accessibility Checks",
      description: "Detect axe-core violations like contrast issues, missing labels, and missing alt text. Fix critical navigability bugs.",
      icon: Eye,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "SEO Audits",
      description: "Scan title tags, meta descriptions, sitemaps, robots.txt, and H1 tags to ensure search engines index your pages correctly.",
      icon: Search,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Security Scans",
      description: "Verify SSL certificates and check critical HTTP headers like CSP, HSTS, X-Frame-Options, and X-Content-Type-Options.",
      icon: ShieldAlert,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Broken Link Crawler",
      description: "Scan your site's anchor tags and images to identify 404 dead links, redirect chains, and broken assets immediately.",
      icon: Link2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Actionable Issue Center",
      description: "Manage, filter, and search all audit issues in a centralized command center. Group bugs by severity levels.",
      icon: Gauge,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Connect Website",
      description: "Enter your domain URL and configure your preferred scan frequencies (manual or scheduled).",
    },
    {
      step: "02",
      title: "Automated Auditing",
      description: "Our background workers spin up Puppeteer, Lighthouse, and crawler engines to perform a multi-point scan.",
    },
    {
      step: "03",
      title: "Get Actionable Reports",
      description: "Review detailed scores, historical performance trends, PDF reports, and step-by-step instructions to fix issues.",
    },
  ];

  const testimonials = [
    {
      quote: "This scanner saved us hours of debugging. We optimized our LCP and fixed accessibility bugs in days.",
      author: "Sarah Connor",
      role: "Lead Engineer, TechCorp",
    },
    {
      quote: "The HTTP header checking and sitemap validator are brilliant. It makes auditing production sites incredibly simple.",
      author: "Alex Mercer",
      role: "Founder, WebFlow Studio",
    },
    {
      quote: "Beautiful interface, fast reports, and a centralized issue manager. Essential tool for modern SaaS developers.",
      author: "Elena Rostova",
      role: "VP of Product, ApexInc",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center overflow-hidden select-none">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-36 flex flex-col items-center text-center">
        {/* Glow Spheres */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Now Powered By Lighthouse & axe-core
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-b from-foreground via-foreground to-foreground/75 bg-clip-text text-transparent">
            Monitor & Optimize Your Website's Health
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Run automated performance, accessibility, SEO, and security audits. Get deep Core Web Vital scores and broken link scans instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all active:scale-[0.99] cursor-pointer"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start Auditing Free"}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/features"
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl bg-secondary/40 border border-border/40 text-sm font-semibold text-foreground hover:bg-secondary/60 hover:border-border/80 transition-all active:scale-[0.99] cursor-pointer"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-border/20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Complete Auditing Toolkit
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Our multi-threaded engine inspects every aspect of your website to identify critical performance bottlenecks, structural issues, and security vulnerabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="bg-card border border-border/30 rounded-2xl p-6 space-y-4 hover:border-border/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${feature.color} shrink-0`}>
                  <Icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full bg-secondary/15 border-t border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:pr-8 flex flex-col justify-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How website health monitoring works
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We leverage cloud-hosted browser instances to test your pages under simulated network conditions, delivering precise insights.
            </p>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, idx) => (
              <div key={idx} className="relative space-y-3">
                <span className="block text-4xl font-extrabold text-primary/20 font-mono leading-none">
                  {item.step}
                </span>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Trusted by product engineers
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            See how developers utilize our diagnostic tools to maintain top SEO rank and core compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-card border border-border/30 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-foreground">{t.author}</h4>
                  <p className="text-xs text-muted-foreground/80">{t.role}</p>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-20">
        <div className="relative w-full rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 px-8 py-12 md:py-16 text-center overflow-hidden flex flex-col items-center space-y-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
          
          <h2 className="text-3xl font-bold tracking-tight text-foreground max-w-xl relative z-10 leading-none">
            Ready to secure and speed up your website?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md relative z-10 leading-relaxed">
            Create a free account and run your first complete performance audit in under 60 seconds.
          </p>
          <div className="relative z-10 pt-2">
            <Link
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all active:scale-[0.99] cursor-pointer"
            >
              {isLoggedIn ? "Dashboard Panel" : "Register Free"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
