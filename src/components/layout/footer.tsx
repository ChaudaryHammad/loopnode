import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { NewsletterForm } from "../marketing/newsletter-form";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/40 select-none">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        {/* Brand Column */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              HealthMonitor
            </span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Enterprise-grade website monitoring SaaS. Scans performance, accessibility, SEO, security, and links to keep your sites in peak condition.
          </p>
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} HealthMonitor. All rights reserved.
          </p>
        </div>

        {/* Product links */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Product</h4>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li>
              <Link href="/features" className="hover:text-foreground transition-colors">
                Audit Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing Plans
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard Overview
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources links */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4">Resources</h4>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Optimization Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact Support
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-foreground transition-colors">
                Developer API Docs
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div>
          <NewsletterForm />
        </div>
      </div>
    </footer>
  );
}
