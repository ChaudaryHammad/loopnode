import React from "react";
import Link from "next/link";
import { blogPosts } from "@/lib/marketing/blog-posts";

export const metadata = {
  title: "Blog",
  description:
    "Notes on website reliability, Core Web Vitals, accessibility, SEO, and security from the Health Mesh team.",
};

export default function BlogPage() {
  return (
    <div className="flex-1">
      <div className="ln-container py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ln-muted)]">
            Blog
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
            Engineering notes on web health.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--ln-muted)]">
            Practical writing on performance, accessibility, security, and keeping
            production calm.
          </p>
        </div>

        <div className="mt-16 divide-y divide-[var(--ln-line)] border-y border-[var(--ln-line)]">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group grid gap-3 py-8 transition-colors md:grid-cols-[7rem_1fr_auto] md:items-baseline md:gap-8"
            >
              <p className="font-mono text-xs text-[var(--ln-faint)]">{post.date}</p>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ln-muted)]">
                  {post.category}
                </p>
                <h2 className="mt-2 font-display text-2xl font-medium text-[var(--ln-ink)] transition-colors group-hover:text-[var(--ln-signal-ink)]">
                  {post.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ln-muted)]">
                  {post.description}
                </p>
              </div>
              <p className="font-mono text-xs text-[var(--ln-faint)]">{post.readTime}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
