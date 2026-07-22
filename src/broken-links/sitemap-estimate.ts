import { getOrigin } from "@/lib/scanner/url-utils";

const TIMEOUT_MS = 8000;
const MAX_SITEMAP_FETCHES = 5;
const MAX_BODY_CHARS = 2_000_000;

export interface SitemapEstimate {
  /** Approximate URL count from sitemap(s). Not a guarantee of crawl coverage. */
  approxUrlCount: number | null;
  sitemapUrl: string | null;
  source: "sitemap" | "sitemap_index" | "unreachable" | "empty";
}

function countLocTags(xml: string): number {
  const matches = xml.match(/<loc\b[^>]*>/gi);
  return matches?.length ?? 0;
}

function extractLocUrls(xml: string): string[] {
  const urls: string[] = [];
  const re = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    const value = match[1]?.trim();
    if (value) urls.push(value);
  }
  return urls;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": "HealthMesh-Coverage/2.0 (+https://loopnode.dev)",
        Accept: "application/xml,text/xml,*/*",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, MAX_BODY_CHARS);
  } catch {
    return null;
  }
}

/**
 * Lightweight approx page count from sitemap.xml (and one level of sitemap index).
 * Used for UX guidance — not an exact inventory of the live site.
 */
export async function estimateSitemapSize(siteUrl: string): Promise<SitemapEstimate> {
  const origin = getOrigin(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
  const sitemapUrl = `${origin}/sitemap.xml`;
  const xml = await fetchText(sitemapUrl);

  if (!xml) {
    return {
      approxUrlCount: null,
      sitemapUrl,
      source: "unreachable",
    };
  }

  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  if (!isIndex) {
    const count = countLocTags(xml);
    return {
      approxUrlCount: count > 0 ? count : null,
      sitemapUrl,
      source: count > 0 ? "sitemap" : "empty",
    };
  }

  const childSitemaps = extractLocUrls(xml).slice(0, MAX_SITEMAP_FETCHES);
  let total = 0;
  for (const child of childSitemaps) {
    const childXml = await fetchText(child);
    if (childXml) total += countLocTags(childXml);
  }

  // If index listed more children than we fetched, scale conservatively.
  const listed = extractLocUrls(xml).length;
  if (listed > childSitemaps.length && childSitemaps.length > 0) {
    const avg = total / childSitemaps.length;
    total = Math.round(avg * listed);
  }

  return {
    approxUrlCount: total > 0 ? total : null,
    sitemapUrl,
    source: total > 0 ? "sitemap_index" : "empty",
  };
}
