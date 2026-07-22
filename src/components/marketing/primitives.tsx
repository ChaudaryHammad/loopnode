"use client";

import React from "react";
import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "surface" | "ink";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full",
        tone === "surface" && "bg-[var(--ln-surface)]",
        tone === "ink" && "bg-[var(--ln-panel)] text-white",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ln-muted)]",
        className
      )}
    >
      {children}
    </p>
  );
}

export function MarketingButton({
  href,
  children,
  variant = "primary",
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "panel";
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--ln-radius-sm)] px-5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ln-signal)] focus-visible:ring-offset-2",
        variant === "primary" &&
          "bg-[var(--ln-ink)] text-white hover:bg-[var(--ln-ink-soft)] active:translate-y-px",
        variant === "secondary" &&
          "border border-[var(--ln-line-strong)] bg-[var(--ln-surface)] text-[var(--ln-ink)] hover:border-[var(--ln-ink)]/25 hover:bg-[var(--ln-bg)]",
        variant === "ghost" &&
          "text-[var(--ln-muted)] hover:text-[var(--ln-ink)]",
        variant === "panel" &&
          "bg-white text-[var(--ln-panel)] hover:bg-white/90",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function StatusDot({
  tone = "ok",
  className,
  pulse = false,
}: {
  tone?: "ok" | "warn" | "alert" | "idle";
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full",
        tone === "ok" && "bg-[var(--ln-signal)]",
        tone === "warn" && "bg-[var(--ln-warn)]",
        tone === "alert" && "bg-[var(--ln-alert)]",
        tone === "idle" && "bg-[var(--ln-faint)]",
        pulse && "ln-animate-pulse-dot",
        className
      )}
    />
  );
}

export function MotionSpan(props: HTMLMotionProps<"span">) {
  return <motion.span {...props} />;
}
