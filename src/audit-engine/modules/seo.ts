import type { AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireDom, scoreFromFindings } from "./_helpers";
import { getOrigin } from "@/lib/scanner/url-utils";

export const seoModule: AuditModule = {
  id: "seo",
  label: "SEO",
  async run(ctx) {
    const started = Date.now();
    try {
      const dom = requireDom(ctx);
      const findings = [];

      if (!dom.title) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "CRITICAL" as const,
          title: "Missing document title",
          description: "The page has no <title> element.",
          recommendation: "Add a unique, descriptive <title> in the <head>.",
        });
      } else if (dom.title.length < 30 || dom.title.length > 60) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "MINOR" as const,
          title: "Title length is not optimal",
          description: `Title is ${dom.title.length} characters. Ideal length is 30–60.`,
          recommendation: "Adjust the title length for better search result display.",
          metadata: { title: dom.title },
        });
      }

      if (!dom.metaDescription) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "CRITICAL" as const,
          title: "Missing meta description",
          description: "No meta description found.",
          recommendation: 'Add <meta name="description" content="..."> (120–160 characters).',
        });
      } else if (dom.metaDescription.length < 120 || dom.metaDescription.length > 160) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "MINOR" as const,
          title: "Meta description length is not optimal",
          description: `Meta description is ${dom.metaDescription.length} characters.`,
          recommendation: "Rewrite to 120–160 characters.",
        });
      }

      if (dom.h1Count === 0) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "MAJOR" as const,
          title: "Missing H1 heading",
          description: "The page has no H1 tag.",
          recommendation: "Add one primary <h1> describing the page topic.",
        });
      } else if (dom.h1Count > 1) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "MINOR" as const,
          title: "Multiple H1 headings detected",
          description: `Found ${dom.h1Count} H1 elements.`,
          recommendation: "Use a single H1 and demote others to H2/H3.",
        });
      }

      if (!dom.ogTitle || !dom.ogDescription) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "INFO" as const,
          title: "Incomplete Open Graph tags",
          description: "Open Graph meta tags are missing or incomplete.",
          recommendation: "Add og:title, og:description, and og:image.",
        });
      }

      if (!dom.canonical) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "INFO" as const,
          title: "No canonical URL specified",
          description: "A canonical link helps prevent duplicate content issues.",
          recommendation: 'Add <link rel="canonical" href="...">.',
        });
      }

      for (const img of dom.images) {
        if (img.alt === null || img.alt.trim() === "") {
          findings.push({
            moduleId: "seo",
            category: "SEO" as const,
            severity: "MINOR" as const,
            title: "Image missing alt attribute",
            description: `Image ${img.src ?? ""} has no alt text.`,
            selector: img.selector,
            recommendation: "Add descriptive alt text to all images.",
            metadata: { src: img.src },
          });
        }
      }

      const probe = ctx.siteProbe;
      const origin = getOrigin(ctx.meta.targetUrl);
      if (probe) {
        if (probe.robotsStatus === null || probe.robotsStatus >= 400) {
          findings.push({
            moduleId: "seo",
            category: "SEO" as const,
            severity: "MINOR" as const,
            title: "robots.txt not found",
            description: "Could not fetch a healthy robots.txt from the site root.",
            url: `${origin}/robots.txt`,
            recommendation: "Publish robots.txt at the site root.",
          });
        }
        if (probe.sitemapStatus === null || probe.sitemapStatus >= 400) {
          findings.push({
            moduleId: "seo",
            category: "SEO" as const,
            severity: "MINOR" as const,
            title: "sitemap.xml not found",
            description: "Could not reach sitemap.xml at the site root.",
            url: `${origin}/sitemap.xml`,
            recommendation: "Publish sitemap.xml and reference it in robots.txt.",
          });
        }
      }

      const jsLinks = dom.links.filter((l) => l.href.startsWith("javascript:"));
      if (jsLinks.length > 0) {
        findings.push({
          moduleId: "seo",
          category: "SEO" as const,
          severity: "INFO" as const,
          title: "Non-crawlable links detected",
          description: "Some links use javascript: URLs which search engines cannot follow.",
          recommendation: "Use real href URLs for important navigation.",
        });
      }

      return moduleOk("seo", started, scoreFromFindings(findings), findings, {
        titleLength: dom.title?.length ?? 0,
        h1Count: dom.h1Count,
      });
    } catch (error) {
      return moduleFail("seo", started, error);
    }
  },
};
