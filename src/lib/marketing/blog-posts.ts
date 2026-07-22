export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  content: Array<{ type: "p" | "h2" | "h3" | "ul"; text?: string; items?: string[] }>;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "optimizing-core-web-vitals-nextjs",
    title: "How to Improve Core Web Vitals on Modern Web Apps",
    description:
      "A practical guide to LCP, INP, and CLS — what they measure, why Google cares, and the fixes that actually move your Lighthouse scores.",
    date: "June 15, 2026",
    readTime: "8 min read",
    author: "Health Mesh Team",
    category: "Performance",
    content: [
      {
        type: "p",
        text: "Core Web Vitals are Google's way of measuring real user experience: how fast your page becomes useful, how stable the layout is, and how responsive it feels when someone interacts. Poor scores hurt SEO rankings and increase bounce rates. The good news is that most improvements come from a handful of predictable patterns.",
      },
      {
        type: "h2",
        text: "Largest Contentful Paint (LCP)",
      },
      {
        type: "p",
        text: "LCP measures when the largest visible element — usually a hero image, video poster, or large text block — finishes rendering. Google considers LCP good at 2.5 seconds or less. Above 4 seconds is poor.",
      },
      {
        type: "ul",
        items: [
          "Preload your LCP image with <link rel=\"preload\" as=\"image\"> and serve WebP or AVIF.",
          "Eliminate render-blocking CSS and defer non-critical JavaScript.",
          "Use a CDN and enable compression (Brotli/Gzip) at the edge.",
          "Avoid client-side rendering for above-the-fold content when possible.",
        ],
      },
      {
        type: "h2",
        text: "Interaction to Next Paint (INP)",
      },
      {
        type: "p",
        text: "INP replaced First Input Delay as a Core Web Vital. It captures latency across all interactions on a page, not just the first click. Heavy JavaScript on the main thread is the usual culprit.",
      },
      {
        type: "ul",
        items: [
          "Break up long tasks — anything over 50ms blocks input responsiveness.",
          "Lazy-load third-party scripts (analytics, chat widgets, ads).",
          "Use web workers for expensive computation instead of blocking the UI thread.",
          "Audit bundle size with your build tool and remove unused dependencies.",
        ],
      },
      {
        type: "h2",
        text: "Cumulative Layout Shift (CLS)",
      },
      {
        type: "p",
        text: "CLS quantifies unexpected layout movement. Users experience this as buttons jumping under their cursor or text reflowing while they read. A score below 0.1 is considered good.",
      },
      {
        type: "ul",
        items: [
          "Always set width and height on images and embeds, or use aspect-ratio in CSS.",
          "Reserve space for dynamic content like banners and cookie notices.",
          "Load web fonts with font-display: optional or size-adjust to reduce swap shifts.",
          "Never inject content above existing content after the page has painted.",
        ],
      },
      {
        type: "h2",
        text: "How Health Mesh helps",
      },
      {
        type: "p",
        text: "Health Mesh runs real Lighthouse audits against your live URLs and stores LCP, INP, CLS, FCP, and TBT on every scan. You see trends over time, drill into performance findings, and prioritize fixes by severity — without manually running Chrome DevTools on every deploy.",
      },
    ],
  },
  {
    slug: "wcag-accessibility-checklist-saas",
    title: "A Practical WCAG 2.1 Checklist for SaaS Dashboards",
    description:
      "Accessibility is not a one-time audit. Here is a repeatable checklist for keyboard navigation, contrast, forms, and screen reader compatibility.",
    date: "June 10, 2026",
    readTime: "9 min read",
    author: "Health Mesh Team",
    category: "Accessibility",
    content: [
      {
        type: "p",
        text: "Roughly one in six people worldwide lives with a disability that affects how they use the web. For SaaS products, accessibility failures mean lost customers, support tickets, and legal risk. WCAG 2.1 Level AA is the standard most teams target — and it is entirely testable with the right tools.",
      },
      {
        type: "h2",
        text: "Color contrast and visual design",
      },
      {
        type: "p",
        text: "Text must meet minimum contrast ratios against its background: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px bold). This includes muted labels, placeholder text, and disabled states — not just body copy.",
      },
      {
        type: "ul",
        items: [
          "Never rely on color alone to convey state (use icons or labels for errors).",
          "Test both light and dark themes — contrast often fails when switching modes.",
          "Ensure focus indicators are visible with at least 3:1 contrast against adjacent colors.",
        ],
      },
      {
        type: "h2",
        text: "Keyboard and focus management",
      },
      {
        type: "p",
        text: "Every interactive element must be reachable and operable with a keyboard alone. Tab order should follow visual reading order. Modals must trap focus and return it on close.",
      },
      {
        type: "ul",
        items: [
          "No keyboard traps — users must always be able to Tab out of any component.",
          "Skip links for main content on pages with heavy navigation.",
          "Visible focus rings on buttons, links, and form fields (never outline: none without a replacement).",
          "Dropdowns and menus must support Arrow keys and Escape to close.",
        ],
      },
      {
        type: "h2",
        text: "Forms, labels, and errors",
      },
      {
        type: "p",
        text: "Forms are where accessibility audits find the most violations. Every input needs a programmatic label. Error messages must be announced to screen readers and associated with the field that failed.",
      },
      {
        type: "ul",
        items: [
          "Use <label for=\"...\"> or aria-label — placeholder text is not a label.",
          "Group related fields with fieldset and legend where appropriate.",
          "Surface validation errors in text, not only with red borders.",
        ],
      },
      {
        type: "h2",
        text: "Automated testing with axe-core",
      },
      {
        type: "p",
        text: "Health Mesh injects axe-core into a real browser session during each accessibility audit. It checks WCAG 2 A/AA rules and best practices, then groups violations by severity with selectors so your team knows exactly which elements to fix.",
      },
    ],
  },
  {
    slug: "securing-http-headers-production",
    title: "HTTP Security Headers Explained: CSP, HSTS, and More",
    description:
      "Security headers are your first line of defense against XSS, clickjacking, and downgrade attacks. Here is what each header does and how to configure them.",
    date: "May 28, 2026",
    readTime: "10 min read",
    author: "Health Mesh Team",
    category: "Security",
    content: [
      {
        type: "p",
        text: "Your application code can be perfect and still be vulnerable if HTTP response headers are misconfigured. Headers tell the browser what it is allowed to do with your page — which scripts to run, whether to upgrade to HTTPS, and if your site can be embedded in an iframe.",
      },
      {
        type: "h2",
        text: "Content-Security-Policy (CSP)",
      },
      {
        type: "p",
        text: "CSP is the most powerful header for preventing cross-site scripting (XSS). It defines which sources are trusted for scripts, styles, images, fonts, and connections. A weak CSP with 'unsafe-inline' or wildcards provides little protection.",
      },
      {
        type: "ul",
        items: [
          "Start with default-src 'self' and add directives only as needed.",
          "Use nonces or hashes for inline scripts instead of 'unsafe-inline'.",
          "Set object-src 'none' and base-uri 'self' to block common injection vectors.",
          "Roll out with Content-Security-Policy-Report-Only before enforcing.",
        ],
      },
      {
        type: "h2",
        text: "Strict-Transport-Security (HSTS)",
      },
      {
        type: "p",
        text: "HSTS tells browsers to always use HTTPS for your domain, even if a user types http:// or clicks an insecure link. Set max-age to at least one year (31536000) and include includeSubDomains for full coverage.",
      },
      {
        type: "h2",
        text: "X-Frame-Options and frame-ancestors",
      },
      {
        type: "p",
        text: "Clickjacking attacks embed your site in a transparent iframe to trick users into clicking hidden buttons. X-Frame-Options: DENY or SAMEORIGIN prevents this. CSP frame-ancestors is the modern replacement and supports finer control.",
      },
      {
        type: "h2",
        text: "Other headers worth setting",
      },
      {
        type: "ul",
        items: [
          "X-Content-Type-Options: nosniff — stops MIME-type sniffing attacks.",
          "Referrer-Policy: strict-origin-when-cross-origin — limits referrer leakage.",
          "Permissions-Policy — disables camera, microphone, geolocation unless needed.",
        ],
      },
      {
        type: "h2",
        text: "How Health Mesh grades your CSP",
      },
      {
        type: "p",
        text: "Health Mesh fetches live response headers on every security audit, parses your CSP directives, assigns a letter grade (A–F), and surfaces specific weaknesses like unsafe-inline or missing object-src. You also get tiered recommendations — from quick wins to advanced hardening — so you can improve policy incrementally without breaking production.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
