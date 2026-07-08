"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Bug,
  Building2,
  Check,
  ClipboardCheck,
  Code2,
  Globe2,
  Layers,
  Rocket,
  Search,
  Shield,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { MarketingFaq } from "@/components/marketing/marketing-faq";

const VIEWPORT = { once: true, margin: "-50px" };

const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  },
});

const valueStrip = [
  "Full audits in minutes",
  "No local setup required",
  "Track scores after every deploy",
];

const personas = [
  {
    icon: User,
    title: "Freelance developers",
    scenario: "You ship client sites and need proof they are fast, accessible, and link-clean before handoff.",
    outcome: "Run a full audit from one URL and send a report that clients actually understand.",
  },
  {
    icon: Building2,
    title: "Agencies",
    scenario: "You manage dozens of domains and cannot manually open DevTools on every site every week.",
    outcome: "Monitor every client site from one dashboard and catch regressions between sprints.",
  },
  {
    icon: Layers,
    title: "In-house product teams",
    scenario: "Performance and a11y slip through code review because nobody owns the full audit.",
    outcome: "Give engineering a shared source of truth after every deploy — with history to prove it.",
  },
];

const painPoints = [
  {
    icon: Terminal,
    title: "Five tools, zero overview",
    body: "Lighthouse in Chrome, axe in DevTools, SEO in a spreadsheet, headers in curl. Nothing talks to each other.",
  },
  {
    icon: Bug,
    title: "Found out from a client email",
    body: "The deploy looked fine locally. Production LCP doubled and nobody caught it until a stakeholder noticed.",
  },
  {
    icon: Rocket,
    title: "Audit output nobody acts on",
    body: "A PDF of warnings is not a backlog. Developers need severity, selectors, and clear next steps.",
  },
];

const steps = [
  {
    icon: Globe2,
    title: "Paste a URL",
    body: "No CLI install, no CI pipeline required. LoopNode runs a real Chrome audit in the cloud.",
  },
  {
    icon: Code2,
    title: "Read the report",
    body: "Scores, vitals, and findings grouped by category — performance, a11y, SEO, security, links.",
  },
  {
    icon: ClipboardCheck,
    title: "Fix, deploy, re-run",
    body: "Work the list, ship the fix, scan again. Score history shows whether it actually worked.",
  },
];

const differentiators = [
  {
    icon: Zap,
    title: "Real browser audits",
    body: "Not simulated checks. Real browser runs against your live URL — the same depth you would expect from a manual audit.",
  },
  {
    icon: Search,
    title: "Findings you can locate",
    body: "Accessibility issues include CSS selectors. Performance items name the offending resource.",
  },
  {
    icon: Shield,
    title: "Live security headers",
    body: "Fetch and grade response headers and CSP policies from production — not a static config file.",
  },
];

const homepageFaq = [
  {
    question: "Do I need to install anything?",
    answer:
      "No. Add a public URL in the dashboard and LoopNode runs the audit in the cloud. You get results in the browser — no local Chrome flags, no CI setup required to start.",
  },
  {
    question: "What does an audit actually check?",
    answer:
      "Performance (Lighthouse + Core Web Vitals), accessibility (axe-core WCAG rules), on-page SEO, live HTTP security headers, broken links, and score history across runs. Full details are on the features page.",
  },
  {
    question: "Is this only for big teams?",
    answer:
      "LoopNode works for solo freelancers checking a client handoff, agencies managing many domains, and product teams who want a shared health baseline after each release.",
  },
  {
    question: "How is this different from running Lighthouse myself?",
    answer:
      "Lighthouse gives you one slice. LoopNode combines performance, accessibility, SEO, security, and link crawling in one place, keeps history across runs, and formats findings as an actionable report — not a JSON dump.",
  },
];

interface MarketingSectionsProps {
  isLoggedIn: boolean;
}

export function MarketingSections({ isLoggedIn }: MarketingSectionsProps) {
  return (
    <div className="w-full">
      {/* Value strip */}
      <section className="border-t border-border/20">
        <div className="mx-auto max-w-[88rem] px-6 py-8 md:py-10">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-0"
          >
            {valueStrip.map((line, index) => (
              <React.Fragment key={line}>
                {index > 0 ? (
                  <span
                    className="hidden text-muted-foreground/40 sm:mx-6 sm:inline md:mx-8"
                    aria-hidden
                  >
                    ·
                  </span>
                ) : null}
                <p className="text-sm text-muted-foreground md:text-base">{line}</p>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Hook */}
      <section className="relative border-t border-border/20 bg-[#050505]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--primary-rgb,100,120,255),0.07),transparent)]" />
        <div className="relative mx-auto grid max-w-[88rem] gap-12 px-6 py-16 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl md:leading-[1.12]">
              Your website health command center.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              LoopNode is for developers who are tired of stitching together half a dozen audit
              tools every time a site ships. One URL, one dashboard, one report your team can
              actually work from.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/features" className="h-11 rounded-xl px-7">
                Explore features
                <ArrowRight className="ml-2 h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href={isLoggedIn ? "/dashboard" : "/register"}
                variant="outline"
                className="h-11 rounded-xl px-7"
              >
                {isLoggedIn ? "Open dashboard" : "Try it free"}
              </ButtonLink>
            </div>
          </motion.div>

          {/* Terminal preview */}
          <motion.div
            variants={fadeUp(0.08)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="overflow-hidden rounded-2xl border border-border/30 bg-[#0a0a0a] font-mono text-sm shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border/25 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs text-muted-foreground">loopnode audit</span>
            </div>
            <div className="space-y-1.5 p-5 text-xs leading-relaxed md:text-sm md:leading-relaxed">
              <p>
                <span className="text-emerald-400">$</span>{" "}
                <span className="text-foreground">loopnode scan https://yoursite.com</span>
              </p>
              <p className="text-muted-foreground">→ Launching Chrome audit...</p>
              <p className="text-muted-foreground">→ Scanning performance & vitals</p>
              <p className="text-muted-foreground">→ Checking accessibility</p>
              <p className="text-muted-foreground">→ Checking SEO + security headers</p>
              <p className="text-muted-foreground">→ Crawling broken links</p>
              <p className="pt-2 text-foreground">
                <span className="text-primary">✓</span> Overall score:{" "}
                <span className="font-semibold text-emerald-400">84</span>
              </p>
              <p className="text-foreground">
                <span className="text-amber-400">!</span> 7 findings need attention
              </p>
              <p className="text-muted-foreground">
                → View report at loopnode.app/dashboard
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain points */}
      <section className="border-t border-border/20">
        <div className="mx-auto max-w-[88rem] px-6 py-16 md:py-24">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="mb-12 max-w-xl"
          >
            <p className="text-sm font-medium text-primary">The problem</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Website QA should not eat your Friday afternoon.
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {painPoints.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp(index * 0.07)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                  className="space-y-4 border-l-2 border-primary/30 pl-5"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-border/20 bg-[#050505]">
        <div className="mx-auto max-w-[88rem] px-6 py-16 md:py-24">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="mb-12 max-w-xl"
          >
            <p className="text-sm font-medium text-primary">Who it&apos;s for</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              If you ship websites, this is for you.
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {personas.map((persona, index) => {
              const Icon = persona.icon;
              return (
                <motion.article
                  key={persona.title}
                  variants={fadeUp(index * 0.06)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                  className="flex flex-col rounded-2xl border border-border/25 bg-card/20 p-6 md:p-7"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border/30 bg-background/60">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{persona.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {persona.scenario}
                  </p>
                  <p className="mt-4 flex-1 border-t border-border/20 pt-4 text-sm leading-relaxed text-foreground/90">
                    <Check className="mr-2 inline h-4 w-4 text-emerald-400" />
                    {persona.outcome}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-t border-border/20">
        <div className="mx-auto max-w-[88rem] px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <motion.div
              variants={fadeUp(0)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="space-y-6"
            >
              <p className="text-sm font-medium text-primary">Why developers switch</p>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Reports built for fixing — not just scoring.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                A number on a dashboard is not enough. LoopNode tells you what broke, where it
                lives, and how severe it is — so you can open the right file and ship the fix.
              </p>
              <ul className="space-y-3">
                {differentiators.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/25 bg-card/30">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp(0.08)}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              className="rounded-2xl border border-border/30 bg-card/30 p-5 md:p-6"
            >
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Sample findings
              </p>
              <div className="space-y-2">
                {[
                  {
                    severity: "High",
                    tone: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                    title: "LCP element loads late",
                    meta: "img.hero-banner — 3.8s",
                  },
                  {
                    severity: "Critical",
                    tone: "text-rose-400 bg-rose-500/10 border-rose-500/20",
                    title: "Button missing accessible name",
                    meta: "button.checkout-cta",
                  },
                  {
                    severity: "Medium",
                    tone: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    title: "Missing Content-Security-Policy",
                    meta: "security headers",
                  },
                  {
                    severity: "Low",
                    tone: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                    title: "Broken external link",
                    meta: "/blog/old-post → 404",
                  },
                ].map((finding) => (
                  <div
                    key={finding.title}
                    className="flex items-start gap-3 rounded-xl border border-border/20 bg-background/50 px-4 py-3"
                  >
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${finding.tone}`}
                    >
                      {finding.severity}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{finding.title}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                        {finding.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/20 bg-[#050505]">
        <div className="mx-auto max-w-[88rem] px-6 py-16 md:py-24">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="mb-12 md:mb-16"
          >
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-2 max-w-md text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Three steps. No yak shaving.
            </h2>
          </motion.div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-border/25 bg-border/25 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={fadeUp(index * 0.06)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                  className="flex flex-col bg-[#050505] p-6 md:p-8"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/20">
        <div className="mx-auto max-w-[88rem] px-6 py-16 md:py-24">
          <MarketingFaq
            title="Questions developers ask first"
            description="Straight answers — no sales fluff. Pricing and plan details live on the pricing page."
            items={homepageFaq}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/20 bg-[#050505]">
        <div className="mx-auto max-w-[88rem] px-6 py-20 md:py-28">
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {isLoggedIn
                ? "Your next audit is one click away."
                : "Paste a URL. Know where you stand."}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {isLoggedIn
                ? "Jump back into your dashboard and run a scan — or review what changed since your last deploy."
                : "Free 14-day trial. Full audits in minutes. Built for developers who ship real websites."}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="h-12 rounded-xl px-8 text-sm font-semibold"
              >
                {isLoggedIn ? "Go to dashboard" : "Start free trial"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/features" variant="outline" className="h-12 rounded-xl px-8">
                See what&apos;s included
              </ButtonLink>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
