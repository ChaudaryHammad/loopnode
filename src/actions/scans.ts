"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Realistic mock issue pools per category ───────────────────────────────

const PERFORMANCE_ISSUES = [
  {
    severity: "CRITICAL" as const,
    title: "Render-blocking resources detected",
    description:
      "Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical resources.",
    recommendation: "Use <link rel='preload'> for critical assets and defer non-critical JavaScript.",
  },
  {
    severity: "MAJOR" as const,
    title: "Images not using next-gen formats",
    description:
      "Image formats like WebP and AVIF provide better compression than PNG or JPEG, which means faster downloads and less data consumption.",
    recommendation: "Serve images in WebP or AVIF format. Use Next.js <Image> component.",
  },
  {
    severity: "MAJOR" as const,
    title: "Unused JavaScript detected",
    description:
      "Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.",
    recommendation: "Enable code-splitting and lazy load non-critical modules.",
  },
  {
    severity: "MINOR" as const,
    title: "Efficiently encode images",
    description:
      "Optimized images load faster and consume less cellular data.",
    recommendation: "Compress and resize images to match display dimensions.",
  },
  {
    severity: "INFO" as const,
    title: "Enable text compression",
    description:
      "Text-based resources should be served with compression (gzip, deflate or brotli) to minimize total network bytes.",
    recommendation: "Enable gzip or Brotli compression at the server/CDN level.",
  },
];

const ACCESSIBILITY_ISSUES = [
  {
    severity: "CRITICAL" as const,
    title: "Missing alt text on images",
    description:
      "Informative images must have alternative text. Screen readers rely on alt attributes to convey meaning to visually impaired users.",
    selector: "img:not([alt])",
    recommendation: "Add descriptive alt attributes to all informative <img> elements.",
  },
  {
    severity: "CRITICAL" as const,
    title: "Form inputs missing labels",
    description:
      "Every form element should have a corresponding <label> to help assistive technology users understand the purpose of each control.",
    selector: "input:not([aria-label]):not([id])",
    recommendation: "Add <label> elements or aria-label attributes to all form controls.",
  },
  {
    severity: "MAJOR" as const,
    title: "Low color contrast ratio",
    description:
      "Text has insufficient contrast against its background color. Users with low vision may have difficulty reading the content.",
    selector: "p, span, a",
    recommendation: "Ensure a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.",
  },
  {
    severity: "MAJOR" as const,
    title: "Missing ARIA landmark roles",
    description:
      "Landmark roles help assistive technology users navigate within a page.",
    recommendation: "Add role='main', role='navigation', role='banner' etc. to appropriate elements.",
  },
  {
    severity: "MINOR" as const,
    title: "Links do not have descriptive text",
    description:
      "Link text (and alternate text for images used as links) that is discernible, unique, and focusable improves the navigation experience.",
    selector: "a[href]",
    recommendation: "Replace vague link text (e.g., 'click here') with descriptive labels.",
  },
];

const SEO_ISSUES = [
  {
    severity: "CRITICAL" as const,
    title: "Missing meta description",
    description:
      "Meta descriptions may be included in search results to concisely summarize page content. They are a meaningful and digestible summary of your page's content.",
    recommendation: "Add a <meta name='description'> tag with 120–160 characters of unique descriptive content.",
  },
  {
    severity: "MAJOR" as const,
    title: "Document does not have a meta description",
    description:
      "Meta descriptions allow pages to have a unique and concise description in search results.",
    recommendation: "Add a <meta name='description' content='...'> tag to the <head>.",
  },
  {
    severity: "MAJOR" as const,
    title: "Image elements do not have explicit width and height",
    description:
      "Set an explicit width and height on image elements to reduce layout shifts and improve CLS.",
    recommendation: "Add width and height attributes to <img> elements matching their intrinsic dimensions.",
  },
  {
    severity: "MINOR" as const,
    title: "Links are not crawlable",
    description:
      "Search engines may use href attributes on anchor elements to crawl websites. Ensure that the href attribute of anchor elements links to an appropriate destination.",
    recommendation: "Use <a href='url'> elements for navigation instead of JavaScript click handlers.",
  },
  {
    severity: "INFO" as const,
    title: "Page lacks social meta tags",
    description:
      "Open Graph and Twitter Card tags control how your content appears when shared on social platforms.",
    recommendation: "Add og:title, og:description, og:image and twitter:card meta tags.",
  },
];

const SECURITY_ISSUES = [
  {
    severity: "CRITICAL" as const,
    title: "Missing Content Security Policy header",
    description:
      "A Content Security Policy (CSP) helps prevent Cross-Site Scripting (XSS) attacks by specifying which dynamic resources are allowed to load.",
    recommendation: "Implement a strict Content-Security-Policy header on your server.",
  },
  {
    severity: "MAJOR" as const,
    title: "X-Frame-Options header not set",
    description:
      "The X-Frame-Options HTTP response header can be used to indicate whether or not a browser should be allowed to render a page in a <frame>, <iframe>, <embed> or <object>.",
    recommendation: "Add the X-Frame-Options: DENY or SAMEORIGIN header.",
  },
  {
    severity: "MAJOR" as const,
    title: "Strict-Transport-Security header missing",
    description:
      "HTTP Strict Transport Security (HSTS) is a web security policy mechanism that tells browsers to only interact with the server using HTTPS connections.",
    recommendation: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
  },
  {
    severity: "MINOR" as const,
    title: "Referrer-Policy header not configured",
    description:
      "The Referrer-Policy HTTP header controls how much referrer information should be included with requests.",
    recommendation: "Set Referrer-Policy: strict-origin-when-cross-origin",
  },
  {
    severity: "INFO" as const,
    title: "Permissions-Policy header not set",
    description:
      "Permissions-Policy provides a mechanism to allow or deny the use of browser features in a document.",
    recommendation: "Add a Permissions-Policy header to restrict access to browser APIs.",
  },
];

const BROKEN_LINKS_ISSUES = [
  {
    severity: "CRITICAL" as const,
    title: "404 Not Found: /about-us",
    description: "The link to '/about-us' returns a 404 status code.",
    url: "/about-us",
    recommendation: "Fix or remove the broken internal link.",
  },
  {
    severity: "MAJOR" as const,
    title: "301 Redirect chain detected",
    description: "Links with multiple redirects slow down page load and waste crawl budget.",
    url: "/old-page",
    recommendation: "Update links to point directly to the final destination URL.",
  },
  {
    severity: "MINOR" as const,
    title: "External link returns 403 Forbidden",
    description: "An external resource link is returning 403 Forbidden, which may indicate broken integration.",
    url: "https://external-cdn.example.com/script.js",
    recommendation: "Update or remove the external link pointing to an inaccessible resource.",
  },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randScore(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min);
}

// ─── Main scan action ──────────────────────────────────────────────────────

export async function triggerScanAction(websiteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const userId = session.user.id;

  // Verify ownership
  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId, deletedAt: null },
  });

  if (!website) {
    return { success: false, error: "Website not found or access denied." };
  }

  // Check if a scan is already running
  const running = await prisma.scan.findFirst({
    where: { websiteId, status: "RUNNING" },
  });
  if (running) {
    return { success: false, error: "A scan is already running for this website." };
  }

  try {
    // Create the scan record as RUNNING
    const scan = await prisma.scan.create({
      data: {
        websiteId,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    // Generate realistic scores
    const performanceScore = randScore(30, 100);
    const accessibilityScore = randScore(40, 100);
    const seoScore = randScore(50, 100);
    const securityScore = randScore(20, 100);
    const overallScore = Math.round(
      (performanceScore + accessibilityScore + seoScore + securityScore) / 4
    );

    // Generate Core Web Vitals based on performance score
    const basePerf = 100 - performanceScore;
    const fcp = Math.round(1200 + basePerf * 30 + Math.random() * 500);
    const lcp = Math.round(2000 + basePerf * 50 + Math.random() * 1000);
    const cls = parseFloat((0.02 + (basePerf / 100) * 0.3 + Math.random() * 0.05).toFixed(3));
    const inp = Math.round(100 + basePerf * 15 + Math.random() * 200);
    const tbt = Math.round(50 + basePerf * 20 + Math.random() * 300);

    // Build issues pool
    const issueData: any[] = [];

    // Performance issues
    const perfIssueCount = performanceScore < 50 ? 4 : performanceScore < 80 ? 2 : 1;
    pickRandom(PERFORMANCE_ISSUES, perfIssueCount).forEach((issue) => {
      issueData.push({
        scanId: scan.id,
        category: "PERFORMANCE",
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
      });
    });

    // Accessibility issues
    const a11yIssueCount = accessibilityScore < 50 ? 4 : accessibilityScore < 80 ? 2 : 1;
    pickRandom(ACCESSIBILITY_ISSUES, a11yIssueCount).forEach((issue) => {
      issueData.push({
        scanId: scan.id,
        category: "ACCESSIBILITY",
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        selector: (issue as any).selector ?? null,
        recommendation: issue.recommendation,
      });
    });

    // SEO issues
    const seoIssueCount = seoScore < 60 ? 4 : seoScore < 85 ? 2 : 1;
    pickRandom(SEO_ISSUES, seoIssueCount).forEach((issue) => {
      issueData.push({
        scanId: scan.id,
        category: "SEO",
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
      });
    });

    // Security issues
    const secIssueCount = securityScore < 50 ? 4 : securityScore < 80 ? 3 : 1;
    pickRandom(SECURITY_ISSUES, secIssueCount).forEach((issue) => {
      issueData.push({
        scanId: scan.id,
        category: "SECURITY",
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
      });
    });

    // Broken links (random 0-3)
    const linkCount = Math.floor(Math.random() * 4);
    pickRandom(BROKEN_LINKS_ISSUES, linkCount).forEach((issue) => {
      issueData.push({
        scanId: scan.id,
        category: "BROKEN_LINKS",
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        url: issue.url ?? null,
        recommendation: issue.recommendation,
      });
    });

    // Update the scan to COMPLETED with scores + vitals + issues
    const completedScan = await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "COMPLETED",
        overallScore,
        performanceScore,
        accessibilityScore,
        seoScore,
        securityScore,
        fcp,
        lcp,
        cls,
        inp,
        tbt,
        completedAt: new Date(),
        issues: {
          create: issueData.map(({ scanId: _s, ...rest }) => rest),
        },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "SCAN_COMPLETED",
        description: `Completed audit for "${website.name}" — overall score: ${overallScore}`,
        metadata: { websiteId, scanId: scan.id, overallScore },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/websites");
    revalidatePath(`/dashboard/websites/${websiteId}`);

    return { success: true, data: completedScan };
  } catch (error) {
    console.error("Scan error:", error);
    return { success: false, error: "Failed to complete scan. Please try again." };
  }
}

// ─── Get scan details ──────────────────────────────────────────────────────

export async function getScanDetailsAction(scanId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    include: {
      issues: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
      website: { select: { id: true, name: true, url: true } },
    },
  });

  if (!scan) return { success: false, error: "Scan not found." };

  return { success: true, data: scan };
}
