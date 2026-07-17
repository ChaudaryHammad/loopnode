import * as cheerio from "cheerio";
import type { DomArtifact, ResponseArtifact, SiteProbe } from "../core/types";
import { getOrigin, isSameOrigin, normalizeUrl } from "@/lib/scanner/url-utils";
import { buildElementSelector } from "@/lib/scanner/url-utils";

const FETCH_TIMEOUT_MS = 15000;
const PROBE_TIMEOUT_MS = 8000;
/** Bound HTML before Cheerio to protect Trigger memory on large pages. */
const MAX_HTML_BYTES = 2_500_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; LoopNodeAudit/2.0; +https://loopnode.dev)";

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

async function readBoundedText(res: Response, maxBytes: number): Promise<string> {
  const contentLength = Number(res.headers.get("content-length") ?? NaN);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(
      `Target HTML exceeds ${Math.round(maxBytes / 1024)} KiB (${contentLength} bytes).`
    );
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    if (text.length > maxBytes) {
      return text.slice(0, maxBytes);
    }
    return text;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      chunks.push(value.slice(0, Math.max(0, value.byteLength - (total - maxBytes))));
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      break;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

export async function collectTargetResponse(targetUrl: string): Promise<ResponseArtifact> {
  const started = Date.now();
  const res = await fetch(targetUrl, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
  });

  const contentType = res.headers.get("content-type");
  const isHtml =
    (contentType ?? "").includes("text/html") ||
    (contentType ?? "").includes("application/xhtml");
  const body = isHtml ? await readBoundedText(res, MAX_HTML_BYTES) : null;

  return {
    url: targetUrl,
    finalUrl: res.url || targetUrl,
    status: res.status,
    headers: headersToRecord(res.headers),
    redirectChain: [],
    timingMs: Date.now() - started,
    body,
    contentType,
  };
}

export async function collectSiteProbe(targetUrl: string): Promise<SiteProbe> {
  const origin = getOrigin(targetUrl);

  const [robots, sitemap] = await Promise.all([
    fetch(`${origin}/robots.txt`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    })
      .then(async (res) => ({
        status: res.status,
        body: res.ok ? (await res.text()).slice(0, 8000) : null,
      }))
      .catch(() => ({ status: null as number | null, body: null })),
    fetch(`${origin}/sitemap.xml`, {
      method: "HEAD",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    })
      .then((res) => res.status)
      .catch(() => null as number | null),
  ]);

  return {
    robotsStatus: robots.status,
    robotsBody: robots.body,
    sitemapStatus: sitemap,
  };
}

export function parseDomArtifact(html: string, pageUrl: string): DomArtifact {
  const $ = cheerio.load(html);
  const origin = getOrigin(pageUrl);

  const images: DomArtifact["images"] = [];
  $("img").each((index, el) => {
    const src = $(el).attr("src") ?? null;
    const alt = $(el).attr("alt") ?? null;
    const id = $(el).attr("id") ?? undefined;
    const className = $(el).attr("class") ?? undefined;
    images.push({
      src,
      alt,
      selector: buildElementSelector("img", id, className, index),
    });
  });

  const links: DomArtifact["links"] = [];
  $("a[href]").each((_, el) => {
    const raw = $(el).attr("href");
    if (!raw) return;
    const href = normalizeUrl(raw, pageUrl);
    if (!href) return;
    links.push({
      href,
      text: $(el).text().trim().slice(0, 120),
      rel: $(el).attr("rel") ?? null,
      isInternal: isSameOrigin(href, origin),
    });
  });

  const scripts: string[] = [];
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) scripts.push(src);
  });

  const stylesheets: string[] = [];
  $('link[rel="stylesheet"][href]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) stylesheets.push(href);
  });

  const jsonLdBlocks: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).html()?.trim();
    if (text) jsonLdBlocks.push(text.slice(0, 5000));
  });

  const h1Texts = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  return {
    title: $("title").first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || null,
    canonical: $('link[rel="canonical"]').attr("href")?.trim() || null,
    ogTitle: $('meta[property="og:title"]').attr("content")?.trim() || null,
    ogDescription: $('meta[property="og:description"]').attr("content")?.trim() || null,
    h1Texts,
    h1Count: h1Texts.length,
    images,
    links,
    scripts,
    stylesheets,
    jsonLdBlocks,
    htmlLang: $("html").attr("lang")?.trim() || null,
    doctypePresent: /^\s*<!doctype\s+html/i.test(html),
    rawHtml: html,
  };
}
