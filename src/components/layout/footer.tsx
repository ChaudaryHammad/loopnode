"use client";

import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { NewsletterForm } from "../marketing/newsletter-form";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative bg-[#050505] border-t border-white/5 select-none overflow-hidden pt-20 pb-10">
      {/* Huge faded watermark background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] md:text-[25rem] font-black text-white/[0.015] pointer-events-none whitespace-nowrap z-0">
        LOOPNODE
      </div>

      <div className="max-w-[88rem] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_-3px_rgba(var(--primary-rgb,100,120,255),0.4)]">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                LoopNode
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The unified website health dashboard. Monitor Core Web Vitals, accessibility, SEO, and security from a single pane of glass.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors" aria-label="X (Twitter)">
                {/* X Logo */}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-[#E1306C] hover:border-[#E1306C]/50 transition-colors" aria-label="Instagram">
                {/* Instagram Logo */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-white/30 transition-colors" aria-label="GitHub">
                {/* Official GitHub Logo */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li>
                <Link href="/features" className="hover:text-primary transition-colors">Audit Engines</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">Live Dashboard</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Enterprise</Link>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-muted-foreground font-medium">
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">Engineering Blog</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-3 lg:col-start-10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-6">Stay Updated</h4>
            <div className="bg-card/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-muted-foreground">
            @ {new Date().getFullYear()} LoopNode. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
