import React from "react";
import Link from "next/link";
import { Check, Activity, Sparkles, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Pricing Plans",
  description: "Simple, transparent pricing built for websites of all sizes. Choose a plan that fits your auditing needs.",
};

export default function PricingPage() {
  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      period: "forever",
      description: "Perfect for scanning individual websites and testing core components.",
      features: [
        "1 Website connection",
        "Manual audits only",
        "Core Web Vitals scores",
        "Basic accessibility scans",
        "1 Level deep link check",
        "Community support",
      ],
      cta: "Get Started Free",
      href: "/register",
      popular: false,
    },
    {
      name: "Pro Professional",
      price: "$29",
      period: "per month",
      description: "Ideal for growth businesses requiring scheduled checks and historical reporting.",
      features: [
        "10 Websites connection",
        "Daily automated scans",
        "Lighthouse & axe-core audits",
        "Comprehensive SEO analysis",
        "Complete broken link crawls",
        "Email & PDF report downloads",
        "Weekly health summaries",
        "Priority support",
      ],
      cta: "Start Pro Trial",
      href: "/register",
      popular: true,
    },
    {
      name: "Enterprise Engine",
      price: "$99",
      period: "per month",
      description: "Built for agencies managing client domains and complex architectures.",
      features: [
        "Unlimited Websites connection",
        "Hourly automated scans",
        "Custom auditing thresholds",
        "Full broken link crawler (unlimited levels)",
        "White label PDF reports",
        "Cloudinary storage hosting",
        "Dedicated account manager",
        "24/7 Phone & Slack support",
      ],
      cta: "Contact Enterprise",
      href: "/contact",
      popular: false,
    },
  ];

  const faqs = [
    {
      question: "How long does a typical scan take?",
      answer: "A standard scan takes between 10 to 30 seconds depending on the website size. The crawler visits pages asynchronously so your dashboard is never blocked.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can upgrade, downgrade, or cancel your plan at any time directly inside your billing settings. No lock-in contracts.",
    },
    {
      question: "Do you offer API access?",
      answer: "Yes, our Enterprise tier includes fully documented API endpoints to trigger scans programmatically and retrieve JSON payloads.",
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 select-none">
      {/* Header text */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Start scanning for free, and scale as your domain network expands. Upgrade to Pro for automated tracking and detailed PDF reports.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-24">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`relative rounded-3xl p-8 bg-card border flex flex-col justify-between h-full transition-all duration-300 ${
              plan.popular
                ? "border-primary shadow-xl shadow-primary/5 ring-1 ring-primary scale-102"
                : "border-border/40 hover:border-border/80"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-md">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed min-h-8">
                  {plan.description}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground">/ {plan.period}</span>
              </div>

              <div className="border-t border-border/30 pt-6">
                <ul className="space-y-3.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href={plan.href}
                className={`flex items-center justify-center w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.99] cursor-pointer ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/10"
                    : "bg-secondary/40 hover:bg-secondary/60 text-foreground border border-border/45"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto border-t border-border/20 pt-16">
        <div className="text-center mb-12 space-y-2">
          <HelpCircle className="w-8 h-8 text-primary mx-auto mb-2" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-card border border-border/30 rounded-2xl p-6 space-y-2">
              <h4 className="text-sm sm:text-base font-bold text-foreground">{faq.question}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
