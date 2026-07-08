"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarketingFaqItem {
  question: string;
  answer: string;
}

interface MarketingFaqProps {
  title: string;
  description?: string;
  items: MarketingFaqItem[];
  /** When false, all answers stay visible (pricing-style). */
  collapsible?: boolean;
  className?: string;
}

export function MarketingFaq({
  title,
  description,
  items,
  collapsible = true,
  className,
}: MarketingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(collapsible ? 0 : null);

  return (
    <section className={cn("w-full", className)}>
      <header className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
        <p className="text-sm font-medium text-primary">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
      </header>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-border/40 bg-card/20">
        {items.map((item, index) => {
          const isOpen = collapsible ? openIndex === index : true;
          const isLast = index === items.length - 1;

          if (!collapsible) {
            return (
              <article
                key={item.question}
                className={cn("px-5 py-5 md:px-6 md:py-6", !isLast && "border-b border-border/40")}
              >
                <h3 className="text-base font-medium leading-snug text-foreground">
                  {item.question}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </article>
            );
          }

          return (
            <article
              key={item.question}
              className={cn(!isLast && "border-b border-border/40")}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors md:px-6 md:py-5",
                  isOpen ? "bg-card/40" : "hover:bg-card/30",
                )}
                aria-expanded={isOpen}
              >
                <span className="text-base font-medium leading-snug text-foreground">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180 text-foreground",
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30 bg-card/20 px-5 pb-5 pt-4 md:px-6 md:pb-6">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}
