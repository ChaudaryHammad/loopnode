"use client";

import React from "react";
import Link from "next/link";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { HealthMeshLogo } from "@/components/brand/healthmesh-logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--ln-line)] bg-[var(--ln-surface)]">
      <div className="ln-container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center">
              <HealthMeshLogo variant="ink" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--ln-muted)]">
              Monitoring so products stay reliable, accessible, and open to everyone.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
              Product
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--ln-muted)]">
              <li>
                <Link href="/features" className="transition-colors hover:text-[var(--ln-ink)]">
                  Capabilities
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-[var(--ln-ink)]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-[var(--ln-ink)]">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
              Company
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--ln-muted)]">
              <li>
                <Link href="/blog" className="transition-colors hover:text-[var(--ln-ink)]">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-[var(--ln-ink)]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
              Newsletter
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[var(--ln-line)] pt-8 text-xs text-[var(--ln-faint)] md:flex-row md:items-center">
          <p>© {year} Health Mesh</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacy" className="transition-colors hover:text-[var(--ln-ink)]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--ln-ink)]">
              Terms
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-[var(--ln-ink)]">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
