"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HealthMeshLogo } from "@/components/brand/healthmesh-logo";

interface MarketingNavClientProps {
  isLoggedIn: boolean;
}

const navLinks = [
  { href: "/features", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNavClient({ isLoggedIn }: MarketingNavClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = isHome && !scrolled && !isOpen;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled || isOpen
            ? "border-b border-[var(--ln-line)] bg-[var(--ln-bg)]/90 backdrop-blur-xl"
            : isHome
              ? "border-b border-transparent bg-white/35 backdrop-blur-sm"
              : "border-b border-white/40 bg-white/45 backdrop-blur-md"
        )}
      >
        <div className="ln-container flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="relative z-50 flex items-center"
          >
            <HealthMeshLogo variant="ink" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-[var(--ln-radius-sm)] px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "font-medium text-[var(--ln-ink)]"
                      : overHero
                        ? "font-medium text-[var(--ln-ink-soft)] hover:text-[var(--ln-ink)]"
                        : "text-[var(--ln-muted)] hover:text-[var(--ln-ink)]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--ln-ink-soft)]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "px-3 py-1.5 text-sm transition-colors hover:text-[var(--ln-ink)]",
                    overHero
                      ? "font-medium text-[var(--ln-ink-soft)]"
                      : "text-[var(--ln-muted)]"
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[var(--ln-ink-soft)]"
                >
                  Start trial
                  <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "relative z-50 rounded-[var(--ln-radius-sm)] p-2 transition-colors hover:bg-black/5 hover:text-[var(--ln-ink)] md:hidden",
              overHero
                ? "text-[var(--ln-ink-soft)]"
                : "text-[var(--ln-muted)]"
            )}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 z-40 bg-[var(--ln-bg)] md:hidden"
          >
            <div className="ln-container flex h-full flex-col pt-4">
              <nav className="flex flex-col">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block border-b border-[var(--ln-line)] py-4 text-lg font-medium",
                        pathname === link.href
                          ? "text-[var(--ln-ink)]"
                          : "text-[var(--ln-muted)]"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-8 flex flex-col gap-3 pb-10">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex h-12 items-center justify-center gap-2 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-sm font-medium text-white"
                  >
                    Go to dashboard
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex h-12 items-center justify-center gap-2 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-sm font-medium text-white"
                    >
                      Start free trial
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex h-12 items-center justify-center rounded-[var(--ln-radius-sm)] border border-[var(--ln-line-strong)] text-sm font-medium text-[var(--ln-ink)]"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
