import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  Sparkles,
  Wallet,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  PLAN_LABELS,
  PLAN_PRICES_USD,
  PLAN_SCAN_SCHEDULING,
  PLAN_SITE_LIMITS,
} from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MarketingFaq } from "@/components/marketing/marketing-faq";

export const metadata = {
  title: "Pricing",
  description:
    "LoopNode pricing — 14-day free trial, then upgrade from your dashboard with bank transfer, mobile wallet, or other payment options.",
};

const UPGRADE_STEPS = [
  {
    title: "Start your free trial",
    body: "Create an account — no payment needed. You get 14 days of Starter access.",
  },
  {
    title: "Choose a plan in Billing",
    body: "Go to Settings → Billing → Upgrade plan and pick Starter, Pro, or Agency.",
  },
  {
    title: "Complete payment",
    body: "Send the monthly amount using the payment option shown in your dashboard (bank, wallet, etc.).",
  },
  {
    title: "Submit for verification",
    body: "Enter your transaction ID. We verify payment and activate your plan within 1–2 business days.",
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
      description: "For freelancers and solo developers monitoring a handful of sites.",
      features: [
        `Up to ${PLAN_SITE_LIMITS.STARTER} websites`,
        PLAN_SCAN_SCHEDULING.STARTER,
        "No automated scheduling on Starter",
        "Performance, accessibility, SEO & security",
        "Broken link checker (internal)",
        "30-day scan history",
        "Email support",
      ],
      cta: isLoggedIn ? "Upgrade to Starter" : "Start free trial",
      href: upgradeHref,
      popular: false,
    },
    {
      tier: "PRO" as const,
      description: "For growing businesses that need automated monitoring and deeper crawls.",
      features: [
        `Up to ${PLAN_SITE_LIMITS.PRO} websites`,
        PLAN_SCAN_SCHEDULING.PRO,
        "Full performance & accessibility audits",
        "Internal + external link crawls",
        "CSP grading & live header checks",
        "90-day score trends",
        "Priority email support",
      ],
      cta: isLoggedIn ? "Upgrade to Pro" : "Start free trial",
      href: upgradeHref,
      popular: true,
    },
    {
      tier: "AGENCY" as const,
      description: "For agencies and teams managing many client domains.",
      features: [
        `Up to ${PLAN_SITE_LIMITS.AGENCY} websites`,
        PLAN_SCAN_SCHEDULING.AGENCY,
        "Unlimited broken link crawl depth",
        "All Pro audit features",
        "1-year historical data",
        "Dedicated onboarding",
        "Priority support",
      ],
      cta: isLoggedIn ? "Upgrade to Agency" : "Start free trial",
      href: upgradeHref,
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "Which plans include automated scan scheduling?",
      answer:
        "Starter includes manual scans only — you run audits when you need them. Pro and Agency unlock automated scheduling with daily, weekly, or monthly frequency per website.",
    },
    {
      question: "Is there a free trial?",
      answer:
        `Yes. Every new account gets a 14-day free trial on the Starter plan (up to ${PLAN_SITE_LIMITS.STARTER} websites). No payment or card is required to sign up.`,
    },
    {
      question: "How do I pay after the trial?",
      answer: isLoggedIn
        ? "Open Settings → Billing → Upgrade plan. Choose your plan, pay using the instructions shown, then submit your transaction ID for verification."
        : "After you register, go to Settings → Billing → Upgrade plan in your dashboard. Choose a plan, complete payment using the methods shown there, and submit your transaction reference.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "Payment options are shown in your dashboard when you upgrade — bank transfer, mobile wallets, and similar methods. We verify each payment manually before activating your plan.",
    },
    {
      question: "How long does activation take?",
      answer:
        "Once you submit your payment reference, our team verifies it and activates your plan. Most upgrades are approved within 1–2 business days. You'll get an in-app notification and email.",
    },
    {
      question: "Can I change or cancel my plan?",
      answer:
        "Yes. Manage your subscription from Settings → Billing. Plans are monthly with no long-term contract. Contact support if you need help downgrading or cancelling.",
    },
  ];

  return (
    <div className="flex-1 w-full max-w-[88rem] mx-auto px-6 sm:px-8 lg:px-12 py-12 md:py-24">
      <div className="text-center max-w-3xl mx-auto mb-6 space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Simple, honest pricing
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Start free for 14 days. When you&apos;re ready, upgrade from your dashboard — pay by
          transfer or wallet, submit your reference, and we&apos;ll activate your plan.
        </p>
      </div>

      <p className="text-center text-sm text-primary font-medium mb-10">
        14-day free trial · Pay after you&apos;re ready · No card required to sign up
      </p>

      {isLoggedIn && (
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="rounded-2xl border-primary/25 bg-primary/5">
            <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Ready to upgrade?</p>
                  <p className="text-sm text-muted-foreground">
                    Payment instructions are in your dashboard billing settings.
                  </p>
                </div>
              </div>
              <ButtonLink href={upgradeHref} className="gap-2 shrink-0">
                Upgrade now
                <ArrowRight className="w-4 h-4" />
              </ButtonLink>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.tier}
            className={`relative flex flex-col h-full rounded-3xl ${
              plan.popular
                ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary"
                : "border-border/40"
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 uppercase tracking-wider shadow-md">
                <Sparkles className="w-3 h-3" />
                Most popular
              </Badge>
            )}

            <CardHeader className="space-y-6 flex-1">
              <div>
                <CardTitle className="text-lg">{PLAN_LABELS[plan.tier]}</CardTitle>
                <CardDescription className="mt-2 leading-relaxed min-h-12">
                  {plan.description}
                </CardDescription>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">
                  ${PLAN_PRICES_USD[plan.tier]}
                </span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>

              <Separator />
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardHeader>

            <CardFooter className="border-t-0 bg-transparent pt-0 pb-8">
              <ButtonLink
                href={plan.href}
                variant={plan.popular ? "default" : "secondary"}
                size="lg"
                className={`w-full ${plan.popular ? "shadow-lg shadow-primary/10" : ""}`}
              >
                {plan.cta}
              </ButtonLink>
            </CardFooter>
          </Card>
        ))}
      </div>

      <section className="max-w-4xl mx-auto mb-20">
        <div className="text-center mb-10 space-y-2">
          <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
          <h2 className="text-2xl font-bold tracking-tight">How upgrading works</h2>
          <p className="text-sm text-muted-foreground">
            No checkout on this page — everything happens in your{" "}
            <Link href={billingHref} className="text-primary hover:underline">
              billing settings
            </Link>
            .
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {UPGRADE_STEPS.map((step, idx) => (
            <Card key={step.title} className="border-border/30 rounded-2xl">
              <CardHeader className="pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Step {idx + 1}
                </p>
                <CardTitle className="text-base">{step.title}</CardTitle>
                <CardDescription className="leading-relaxed">{step.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] border-t border-border/20 px-6 pt-16 pb-8">
        <MarketingFaq
          title="Frequently asked questions"
          collapsible={false}
          items={faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      </section>
    </div>
  );
}
