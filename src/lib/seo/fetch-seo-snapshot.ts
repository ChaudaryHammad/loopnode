import * as cheerio from "cheerio";
import { getOrigin } from "@/lib/scanner/url-utils";

export type CheckStatus = "pass" | "warn" | "fail" | "unknown";

export interface SeoCheckItem {
  id: string;
  label: string;
  status: CheckStatus;
  value: string | null;
  detail: string;
  recommendation: string;
}

export interface SeoSnapshot {
  reachable: boolean;
  error: string | null;
  checks: SeoCheckItem[];
  passCount: number;
  warnCount: number;
  failCount: number;
}


export async function fetchSeoSnapshot(pageUrl: string): Promise<SeoSnapshot> {
  const checks: SeoCheckItem[] = [];
  const origin = getOrigin(pageUrl);

  let html: string;
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "HealthMesh/1.0 (+https://loopnode.dev)" },
    });
    if (!res.ok) {
      return {
        reachable: false,
        error: `HTTP ${res.status}`,
        checks: [],
        passCount: 0,
        warnCount: 0,
        failCount: 0,
      };
    }
    html = await res.text();
  } catch (err) {
    return {
      reachable: false,
      error: err instanceof Error ? err.message : "Fetch failed",
      checks: [],
      passCount: 0,
      warnCount: 0,
      failCount: 0,
    };
  }

  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  checks.push({
    id: "title",
    label: "Page title",
    status: !title ? "fail" : title.length >= 30 && title.length <= 60 ? "pass" : "warn",
    value: title || null,
    detail: title
      ? `${title.length} characters${title.length < 30 || title.length > 60 ? " — ideal is 30–60" : ""}`
      : "No <title> element found",
    recommendation: "Add a unique, descriptive title between 30–60 characters.",
  });

  const metaDesc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  checks.push({
    id: "meta-description",
    label: "Meta description",
    status: !metaDesc ? "fail" : metaDesc.length >= 120 && metaDesc.length <= 160 ? "pass" : "warn",
    value: metaDesc || null,
    detail: metaDesc
      ? `${metaDesc.length} characters${metaDesc.length < 120 || metaDesc.length > 160 ? " — ideal is 120–160" : ""}`
      : "Missing meta description",
    recommendation: 'Add <meta name="description" content="..."> with 120–160 characters.',
  });

  const h1s = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  checks.push({
    id: "h1",
    label: "H1 heading",
    status: h1s.length === 0 ? "fail" : h1s.length === 1 ? "pass" : "warn",
    value: h1s[0] ?? null,
    detail:
      h1s.length === 0
        ? "No H1 found"
        : h1s.length === 1
          ? "One H1 — good"
          : `${h1s.length} H1 elements — use only one per page`,
    recommendation: "Use a single H1 that describes the main topic of the page.",
  });

  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogComplete = Boolean(ogTitle && ogDesc && ogImage);
  checks.push({
    id: "open-graph",
    label: "Open Graph tags",
    status: ogComplete ? "pass" : ogTitle || ogDesc ? "warn" : "fail",
    value: [ogTitle, ogDesc, ogImage].filter(Boolean).join(" · ") || null,
    detail: ogComplete
      ? "og:title, og:description, and og:image present"
      : `Missing: ${[!ogTitle && "og:title", !ogDesc && "og:description", !ogImage && "og:image"].filter(Boolean).join(", ") || "all tags"}`,
    recommendation: "Add og:title, og:description, and og:image for rich social previews.",
  });

  const canonical = $('link[rel="canonical"]').attr("href");
  checks.push({
    id: "canonical",
    label: "Canonical URL",
    status: canonical ? "pass" : "warn",
    value: canonical ?? null,
    detail: canonical ? "Canonical link set" : "No canonical URL — risk of duplicate content",
    recommendation: 'Add <link rel="canonical" href="..."> to the preferred URL.',
  });

  const robotsMeta = $('meta[name="robots"]').attr("content");
  checks.push({
    id: "robots-meta",
    label: "Robots meta",
    status: robotsMeta?.toLowerCase().includes("noindex") ? "warn" : "pass",
    value: robotsMeta ?? "index, follow (default)",
    detail: robotsMeta?.toLowerCase().includes("noindex")
      ? "Page is set to noindex — it won't appear in search results"
      : "Page is indexable",
    recommendation: robotsMeta?.toLowerCase().includes("noindex")
      ? "Remove noindex if this page should rank in search."
      : "No action needed unless you want to block indexing.",
  });

  let robotsStatus: CheckStatus = "unknown";
  let robotsDetail = "";
  try {
    const robotsRes = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(8000) });
    robotsStatus = robotsRes.ok ? "pass" : "warn";
    robotsDetail = robotsRes.ok ? "robots.txt accessible" : `HTTP ${robotsRes.status}`;
  } catch {
    robotsStatus = "warn";
    robotsDetail = "Could not fetch robots.txt";
  }
  checks.push({
    id: "robots-txt",
    label: "robots.txt",
    status: robotsStatus,
    value: `${origin}/robots.txt`,
    detail: robotsDetail,
    recommendation: "Publish robots.txt at your site root and reference your sitemap.",
  });

  let sitemapStatus: CheckStatus = "unknown";
  let sitemapDetail = "";
  try {
    const sitemapRes = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(8000) });
    sitemapStatus = sitemapRes.ok ? "pass" : "warn";
    sitemapDetail = sitemapRes.ok ? "sitemap.xml accessible" : `HTTP ${sitemapRes.status}`;
  } catch {
    sitemapStatus = "warn";
    sitemapDetail = "Could not fetch sitemap.xml";
  }
  checks.push({
    id: "sitemap",
    label: "XML sitemap",
    status: sitemapStatus,
    value: `${origin}/sitemap.xml`,
    detail: sitemapDetail,
    recommendation: "Add sitemap.xml and submit it in Google Search Console.",
  });

  const imagesWithoutAlt = $("img").filter((_, el) => {
    const alt = $(el).attr("alt");
    return alt === undefined || alt.trim() === "";
  }).length;
  checks.push({
    id: "image-alt",
    label: "Image alt text",
    status: imagesWithoutAlt === 0 ? "pass" : imagesWithoutAlt <= 3 ? "warn" : "fail",
    value: imagesWithoutAlt === 0 ? "All images have alt" : `${imagesWithoutAlt} missing alt`,
    detail:
      imagesWithoutAlt === 0
        ? "All images include alt attributes"
        : `${imagesWithoutAlt} image(s) missing alt text`,
    recommendation: "Add descriptive alt text to every meaningful image.",
  });

  return {
    reachable: true,
    error: null,
    checks,
    passCount: checks.filter((c) => c.status === "pass").length,
    warnCount: checks.filter((c) => c.status === "warn").length,
    failCount: checks.filter((c) => c.status === "fail").length,
  };
}
