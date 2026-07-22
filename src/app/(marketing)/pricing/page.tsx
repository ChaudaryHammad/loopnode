import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  PLAN_LABELS,
  PLAN_PRICES_USD,
  PLAN_SCAN_SCHEDULING,
  PLAN_SITE_LIMITS,
  PLAN_UPTIME_INTERVALS,
} from "@/lib/plans";
import { MarketingButton } from "@/components/marketing/primitives";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing",
  description:
    "Health Mesh pricing — 14-day free trial, then upgrade from your dashboard with bank transfer, mobile wallet, or other payment options.",
};

const UPGRADE_STEPS = [
  {
    title: "Start free",
    body: "Create an account. 14 days of Starter access, no card required.",
  },
  {
    title: "Choose a plan",
    body: "Open Settings → Billing → Upgrade and pick Starter, Pro, or Agency.",
  },
  {
    title: "Pay & verify",
    body: "Complete payment, submit your transaction ID, and we activate within 1–2 business days.",
  },
] as const;

export default async function PricingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const upgradeHref = isLoggedIn
    ? "/dashboard/settings/billing/upgrade"
    : "/register";
  const billingHref = isLoggedIn ? "/dashboard/settings/billing" : "/register";

  const plans = [
    {
      tier: "STARTER" as const,
      description: "For solo developers monitoring a few sites.",
      features: [
        `Up to ${PLAN_SITE_LIMITS.STARTER} websites`,
        PLAN_UPTIME_INTERVALS.STARTER,
        PLAN_SCAN_SCHEDULING.STARTER,
        "Performance, accessibility, SEO & security",
        "Coverage scanner",
        "30-day history",
      ],
      cta: isLoggedIn ? "Upgrade to Starter" : "Start free trial",
      popular: false,
    },
    {
      tier: "PRO" as const,
      description: "For teams that need automated monitoring.",
      features: [
        `Up to ${PLAN_SITE_LIMITS.PRO} websites`,
        PLAN_UPTIME_INTERVALS.PRO,
        PLAN_SCAN_SCHEDULING.PRO,
        "Full audits + external link crawls",
        "CSP grading & header checks",
        "90-day score trends",
      ],
      cta: isLoggedIn ? "Upgrade to Pro" : "Start free trial",
      popular: true,
    },
    {
      tier: "AGENCY" as const,
      description: "For agencies managing many client domains.",
      features: [
        `Up to ${PLAN_SITE_LIMITS.AGENCY} websites`,
        PLAN_UPTIME_INTERVALS.AGENCY,
        PLAN_SCAN_SCHEDULING.AGENCY,
        "Unlimited coverage depth",
        "1-year historical data",
        "Priority support",
      ],
      cta: isLoggedIn ? "Upgrade to Agency" : "Start free trial",
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "Which plans include automated scan scheduling?",
      answer:
        "Starter is manual only. Pro and Agency unlock daily, weekly, or monthly scheduling per website.",
    },
    {
      question: "Is there a free trial?",
      answer: `Yes. Every new account gets 14 days on Starter (up to ${PLAN_SITE_LIMITS.STARTER} websites). No card required.`,
    },
    {
      question: "How do I pay after the trial?",
      answer: isLoggedIn
        ? "Open Settings → Billing → Upgrade plan. Choose a plan, pay using the instructions shown, then submit your transaction ID."
        : "After you register, go to Settings → Billing → Upgrade plan. Choose a plan, complete payment, and submit your reference.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "Bank transfer, mobile wallets, and similar methods shown in your dashboard. Payments are verified manually before activation.",
    },
  ];

  return (
    <div className="flex-1">
      <div className="ln-container py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ln-muted)]">
            Pricing
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-[var(--ln-ink)] md:text-5xl">
            Simple plans. Honest process.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--ln-muted)]">
            Start free for 14 days. Upgrade from your dashboard when you&apos;re
            ready — no card required to sign up.
          </p>
        </div>

        {isLoggedIn && (
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[var(--ln-radius)] border border-[var(--ln-signal)]/20 bg-[var(--ln-signal-soft)]/50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-[var(--ln-ink-soft)]">
              Payment instructions live in your billing settings.
            </p>
            <MarketingButton href={upgradeHref} className="h-10">
              Upgrade now
              <ArrowRight className="size-4" />
            </MarketingButton>
          </div>
        )}

        <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--ln-radius-lg)] border border-[var(--ln-line)] bg-[var(--ln-line)] md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={cn(
                "flex h-full flex-col bg-[var(--ln-surface)] p-7 md:p-8",
                plan.popular && "bg-[var(--ln-panel)] text-white md:scale-[1.01]"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-[0.16em]",
                    plan.popular ? "text-[var(--ln-panel-faint)]" : "text-[var(--ln-muted)]"
                  )}
                >
                  {PLAN_LABELS[plan.tier]}
                </p>
                {plan.popular && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#9fe0d6]">
                    Popular
                  </span>
                )}
              </div>

              <p
                className={cn(
                  "mt-5 font-display text-4xl font-medium",
                  plan.popular ? "text-white" : "text-[var(--ln-ink)]"
                )}
              >
                ${PLAN_PRICES_USD[plan.tier]}
                <span
                  className={cn(
                    "ml-1 text-base font-normal",
                    plan.popular ? "text-[var(--ln-panel-faint)]" : "text-[var(--ln-faint)]"
                  )}
                >
                  /mo
                </span>
              </p>

              <p
                className={cn(
                  "mt-3 text-sm leading-relaxed",
                  plan.popular ? "text-[var(--ln-panel-muted)]" : "text-[var(--ln-muted)]"
                )}
              >
                {plan.description}
              </p>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={cn(
                      "flex items-start gap-2.5 text-sm",
                      plan.popular ? "text-[var(--ln-panel-muted)]" : "text-[var(--ln-muted)]"
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        plan.popular ? "text-[#7dd3c7]" : "text-[var(--ln-signal)]"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <MarketingButton
                href={upgradeHref}
                variant={plan.popular ? "panel" : "secondary"}
                className="mt-8 w-full"
              >
                {plan.cta}
              </MarketingButton>
            </div>
          ))}
        </div>

        <section className="mt-24">
          <h2 className="font-display text-2xl font-medium md:text-3xl">
            How upgrading works
          </h2>
          <p className="mt-3 max-w-xl text-sm text-[var(--ln-muted)]">
            No checkout on this page — everything happens in your{" "}
            <Link href={billingHref} className="underline underline-offset-2">
              billing settings
            </Link>
            .
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {UPGRADE_STEPS.map((step, idx) => (
              <div key={step.title} className="border-t border-[var(--ln-line)] pt-6">
                <p className="font-mono text-xs text-[var(--ln-faint)]">0{idx + 1}</p>
                <h3 className="mt-3 font-display text-xl font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ln-muted)]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 border-t border-[var(--ln-line)] pt-16">
          <h2 className="font-display text-2xl font-medium md:text-3xl">FAQ</h2>
          <div className="mt-8 divide-y divide-[var(--ln-line)] border-y border-[var(--ln-line)]">
            {faqs.map((faq) => (
              <div key={faq.question} className="grid gap-3 py-6 md:grid-cols-[0.9fr_1.1fr]">
                <p className="text-sm font-medium text-[var(--ln-ink)]">{faq.question}</p>
                <p className="text-sm leading-relaxed text-[var(--ln-muted)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
