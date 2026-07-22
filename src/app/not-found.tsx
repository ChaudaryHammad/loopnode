import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MarketingButton } from "@/components/marketing/primitives";

export default async function NotFound() {
  return (
    <div className="marketing flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <section className="ln-container flex flex-1 flex-col items-start justify-center py-24 md:py-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ln-muted)]">
            Error 404
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight text-[var(--ln-ink)] md:text-5xl md:leading-[1.1]">
            This page isn&apos;t on the mesh.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--ln-muted)]">
            The link may be broken, outdated, or mistyped. Head home or jump to
            a page that still exists.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MarketingButton href="/">Back to home</MarketingButton>
            <MarketingButton href="/features" variant="secondary">
              Features
            </MarketingButton>
            <MarketingButton href="/contact" variant="ghost">
              Contact
            </MarketingButton>
          </div>
          <p className="mt-10 text-sm text-[var(--ln-faint)]">
            Looking for the app?{" "}
            <Link
              href="/login"
              className="text-[var(--ln-ink)] underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
