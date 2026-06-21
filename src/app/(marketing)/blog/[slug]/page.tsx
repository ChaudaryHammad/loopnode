import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../page";
import { Calendar, Clock, ChevronLeft, ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Generates metadata for each post dynamically
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Sample static content mapping for MVP Sprints
  const getContent = (slug: string) => {
    switch (slug) {
      case "optimizing-core-web-vitals-nextjs":
        return (
          <>
            <p>
              Next.js 16 brings massive compiler speedups and optimization tools designed to streamline the auditing and delivery of web applications. However, maximizing Core Web Vitals still requires diligent setup across data-fetching boundaries and media components.
            </p>
            <h3>1. Focus on Cumulative Layout Shift (CLS)</h3>
            <p>
              CLS measures page layout stability during rendering. Layout shifts are commonly triggered by dynamic image containers without explicit aspect ratios, ad injections, or font-swap layout modifications. Use the next/image component to enforce size properties on render.
            </p>
            <h3>2. Speed Up Largest Contentful Paint (LCP)</h3>
            <p>
              LCP represents the duration required for the viewport's primary graphic asset to load. Ensure critical hero images include the priority attribute. This tells Next.js to pre-cache the asset at load time.
            </p>
          </>
        );
      case "wcag-accessibility-checklist-saas":
        return (
          <>
            <p>
              Accessibility audits verify your application remains fully functional for screen-readers, braille-displays, and keyboard-only users. Under the hood, we leverage the axe-core testing parser to audit layouts.
            </p>
            <h3>1. Contrast Ratios are Critical</h3>
            <p>
              Insufficient color contrast makes text unreadable for low-vision users. WCAG 2 AA guidelines require contrast ratios above 4.5:1 for standard text and 3:1 for headers. Ensure your palette variables satisfy these ratios.
            </p>
            <h3>2. Always Formulate Keyboard focus states</h3>
            <p>
              Users navigating via the Tab key rely on clear focus rings to know where their selection lies. Never set outline:none in your CSS without replacing it with custom focus-ring glows.
            </p>
          </>
        );
      case "securing-http-headers-production":
        return (
          <>
            <p>
              HTTP response headers act as a crucial security layer between your origin server and client browser. By defining secure parameters, you prevent cross-site scripting (XSS), MIME sniffs, and frame injections.
            </p>
            <h3>1. Content Security Policy (CSP)</h3>
            <p>
              A CSP limits which scripts, stylesheets, and connections the client is allowed to run. Configuring clean script-src hashes protects forms against malicious injection vectors.
            </p>
            <h3>2. HTTP Strict Transport Security (HSTS)</h3>
            <p>
              HSTS forces user browsers to only establish SSL/TLS connections, protecting requests against protocol downgrade attacks (like SSL stripping).
            </p>
          </>
        );
      default:
        return <p>Article content is loading...</p>;
    }
  };

  return (
    <div className="flex-1 max-w-3xl mx-auto px-6 py-12 md:py-20 select-none">
      {/* Back button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Blog
      </Link>

      <article className="space-y-8">
        {/* Header */}
        <div className="space-y-4 border-b border-border/20 pb-8">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {post.category}
          </span>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">By {post.author}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed space-y-6 select-text">
          {getContent(post.slug)}
        </div>
      </article>
    </div>
  );
}
