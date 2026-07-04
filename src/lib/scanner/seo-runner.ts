import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { ScanIssueInput } from "./types";
import { buildElementSelector, getOrigin, normalizeUrl } from "./url-utils";

function imageIssueLocation($: cheerio.CheerioAPI, el: Element) {
  const $el = $(el);
  const id = $el.attr("id")?.trim();
  const className = $el.attr("class")?.trim();
  const src = $el.attr("src")?.trim();
  const siblingIndex = $el.prevAll("img").length;
  const html = $.html(el).slice(0, 200);

  let selector = buildElementSelector("img", id, className, siblingIndex);
  if (selector === "img" && src) {
    selector = `img[src="${src.replace(/"/g, '\\"')}"]`;
  }

  const parent = $el.parent();
  const parentTag = parent.length ? parent.prop("tagName")?.toLowerCase() : undefined;
  const parentId = parent.attr("id")?.trim();
  const parentClass = parent.attr("class")?.trim();

  return {
    selector,
    metadata: {
      html,
      elementTag: "img",
      elementId: id,
      elementClass: className,
      parentTag,
      parentId,
      parentClass,
      src,
    },
  };
}

export async function runSeoAudit(
  pageUrl: string,
  html: string
): Promise<{ score: number; issues: ScanIssueInput[] }> {
  const $ = cheerio.load(html);
  const issues: ScanIssueInput[] = [];
  const origin = getOrigin(pageUrl);

  const title = $("title").first().text().trim();
  if (!title) {
    issues.push({
      category: "SEO",
      severity: "CRITICAL",
      title: "Missing document title",
      description: "The page has no <title> element. Search engines rely on titles for ranking and display.",
      recommendation: "Add a unique, descriptive <title> tag in the <head>.",
    });
  } else if (title.length < 30 || title.length > 60) {
    issues.push({
      category: "SEO",
      severity: "MINOR",
      title: "Title length is not optimal",
      description: `Title is ${title.length} characters. Ideal length is 30–60 characters.`,
      recommendation: "Adjust the title length for better search result display.",
      metadata: { title },
    });
  }

  const metaDesc = $('meta[name="description"]').attr("content")?.trim();
  if (!metaDesc) {
    issues.push({
      category: "SEO",
      severity: "CRITICAL",
      title: "Missing meta description",
      description: "No meta description found. This affects how your page appears in search results.",
      recommendation: "Add <meta name=\"description\" content=\"...\"> with 120–160 characters.",
    });
  } else if (metaDesc.length < 120 || metaDesc.length > 160) {
    issues.push({
      category: "SEO",
      severity: "MINOR",
      title: "Meta description length is not optimal",
      description: `Meta description is ${metaDesc.length} characters. Ideal is 120–160.`,
      recommendation: "Rewrite the meta description to fit recommended length.",
    });
  }

  const h1Count = $("h1").length;
  if (h1Count === 0) {
    issues.push({
      category: "SEO",
      severity: "MAJOR",
      title: "Missing H1 heading",
      description: "The page has no H1 tag. A single H1 helps search engines understand page structure.",
      recommendation: "Add one primary <h1> describing the page topic.",
    });
  } else if (h1Count > 1) {
    issues.push({
      category: "SEO",
      severity: "MINOR",
      title: "Multiple H1 headings detected",
      description: `Found ${h1Count} H1 elements. Best practice is one H1 per page.`,
      recommendation: "Use a single H1 and demote others to H2/H3.",
    });
  }

  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  if (!ogTitle || !ogDesc) {
    issues.push({
      category: "SEO",
      severity: "INFO",
      title: "Incomplete Open Graph tags",
      description: "Open Graph meta tags are missing or incomplete for social sharing.",
      recommendation: "Add og:title, og:description, and og:image meta tags.",
    });
  }

  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    const src = $(el).attr("src");
    if (alt === undefined || alt.trim() === "") {
      const { selector, metadata } = imageIssueLocation($, el);
      issues.push({
        category: "SEO",
        severity: "MINOR",
        title: "Image missing alt attribute",
        description: `Image ${src ?? ""} has no alt text, hurting SEO and accessibility.`,
        selector,
        recommendation: "Add descriptive alt text to all images.",
        metadata,
      });
    }
  });

  const canonical = $('link[rel="canonical"]').attr("href");
  if (!canonical) {
    issues.push({
      category: "SEO",
      severity: "INFO",
      title: "No canonical URL specified",
      description: "A canonical link helps prevent duplicate content issues.",
      recommendation: "Add <link rel=\"canonical\" href=\"...\"> pointing to the preferred URL.",
    });
  }

  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!robotsRes.ok) {
      issues.push({
        category: "SEO",
        severity: "MINOR",
        title: "robots.txt not found",
        description: `robots.txt returned HTTP ${robotsRes.status}.`,
        url: `${origin}/robots.txt`,
        recommendation: "Create a robots.txt at your site root.",
      });
    }
  } catch {
    issues.push({
      category: "SEO",
      severity: "MINOR",
      title: "robots.txt unreachable",
      description: "Could not fetch robots.txt from the site root.",
      url: `${origin}/robots.txt`,
      recommendation: "Ensure robots.txt is accessible.",
    });
  }

  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!sitemapRes.ok) {
      issues.push({
        category: "SEO",
        severity: "MINOR",
        title: "sitemap.xml not found",
        description: `sitemap.xml returned HTTP ${sitemapRes.status}.`,
        url: `${origin}/sitemap.xml`,
        recommendation: "Publish a sitemap.xml and reference it in robots.txt.",
      });
    }
  } catch {
    issues.push({
      category: "SEO",
      severity: "INFO",
      title: "sitemap.xml unreachable",
      description: "Could not fetch sitemap.xml from the site root.",
      url: `${origin}/sitemap.xml`,
      recommendation: "Add a sitemap.xml for better crawlability.",
    });
  }

  const internalLinks = $("a[href]")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean);
  const uncrawlable = internalLinks.filter((href) => {
    const n = normalizeUrl(href!, pageUrl);
    return n && n.startsWith("javascript:");
  });
  if (uncrawlable.length > 0) {
    issues.push({
      category: "SEO",
      severity: "INFO",
      title: "Non-crawlable links detected",
      description: "Some links use javascript: URLs which search engines cannot follow.",
      recommendation: "Use real href URLs for important navigation links.",
    });
  }

  const penalty = issues.reduce((sum, i) => {
    const w = { CRITICAL: 20, MAJOR: 12, MINOR: 5, INFO: 2 };
    return sum + w[i.severity];
  }, 0);

  return { score: Math.max(0, Math.round(100 - penalty)), issues };
}
