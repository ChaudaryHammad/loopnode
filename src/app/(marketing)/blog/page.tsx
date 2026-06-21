import React from "react";
import Link from "next/link";
import { BookOpen, Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Blog & Guides",
  description: "Learn how to optimize Core Web Vitals, improve accessibility standards, configure sitemaps, and secure your sites.",
};

// Static blog posts array for Phase 2A MVP
export const blogPosts = [
  {
    slug: "optimizing-core-web-vitals-nextjs",
    title: "Optimizing Core Web Vitals in Next.js 16 Applications",
    description: "Learn actionable strategies to optimize First Contentful Paint (FCP) and Cumulative Layout Shift (CLS) using new compile caches and fonts.",
    date: "June 15, 2026",
    readTime: "5 min read",
    author: "Hammad Amin",
    category: "Performance",
  },
  {
    slug: "wcag-accessibility-checklist-saas",
    title: "The Ultimate WCAG 2.1 Accessibility Audit Checklist for SaaS",
    description: "How to audit your layouts for keyboard navigation, contrast ratios, and screen readers using axe-core and browser automation.",
    date: "June 10, 2026",
    readTime: "7 min read",
    author: "Elena Rostova",
    category: "Accessibility",
  },
  {
    slug: "securing-http-headers-production",
    title: "Securing HTTP Headers in Production: CSP, HSTS, and X-Frame-Options",
    description: "A developer's guide to configuring secure headers to mitigate Clickjacking, XSS, and MIME-sniffing on serverless platforms.",
    date: "May 28, 2026",
    readTime: "6 min read",
    author: "Alex Mercer",
    category: "Security",
  },
];

export default function BlogPage() {
  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 select-none">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Optimization Blog
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Insights, guides, and tutorials from staff engineers on how to audit, secure, and accelerate your web applications.
        </p>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <article 
            key={post.slug}
            className="bg-card border border-border/30 rounded-3xl p-6 flex flex-col justify-between hover:border-border/80 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="space-y-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {post.category}
              </span>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
              </div>
            </div>

            <div className="border-t border-border/30 mt-6 pt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </span>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors group/link"
              >
                Read
                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
