"use client";

import React from "react";
import Link from "next/link";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { HealthMeshLogo } from "@/components/brand/healthmesh-logo";

const productLinks = [
  { href: "/features", label: "Capabilities" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
];

const companyLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
];

function FooterNav({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
        {title}
      </p>
      <ul className="mt-4 space-y-3 text-sm text-[var(--ln-muted)]">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="transition-colors hover:text-[var(--ln-ink)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--ln-line)] bg-[var(--ln-surface)]">
      <div className="ln-container py-12 sm:py-16 lg:py-20">
        {/*
          Mobile: brand → Product|Company → newsletter
          md+: brand | Product | Company | newsletter
        */}
        <div className="flex flex-col gap-10 md:grid md:grid-cols-12 md:gap-8 lg:gap-10">
          <div className="md:col-span-4 lg:col-span-4">
            <Link href="/" className="inline-flex items-center">
              <HealthMeshLogo variant="ink" />
            </Link>
            <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-[var(--ln-muted)]">
              Monitoring so products stay reliable, accessible, and open to
              everyone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-4 md:grid-cols-2 lg:col-span-4">
            <FooterNav title="Product" links={productLinks} />
            <FooterNav title="Company" links={companyLinks} />
          </div>

          <div className="md:col-span-4 lg:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
              Newsletter
            </p>
            <div className="mt-4 max-w-sm md:max-w-none">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--ln-line)] pt-6 text-xs text-[var(--ln-faint)] sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p>© {year} Health Mesh</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[var(--ln-ink)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
