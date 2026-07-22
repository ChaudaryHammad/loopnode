import * as cheerio from "cheerio";
import type { BrokenLinkScanMode } from "@prisma/client";
import {
  type LinkResourceType,
  classifyLinkResource,
} from "./link-resource-types";
import {
  buildElementSelector,
  getOrigin,
  isCrawlablePageUrl,
  isSameOrigin,
  normalizeUrl,
} from "./url-utils";
import type {
  BrokenLinkScanResult,
  BrokenLinkFinding,
  BrokenLinkProgress,
  ExtractedLink,
  WwwFallbackResolution,
} from "./types";
import { ScanCancelledError } from "./scan-errors";

const FETCH_TIMEOUT_MS = 12000;
const CRAWL_CONCURRENCY = 4;
const CHECK_CONCURRENCY = 8;
const USER_AGENT = "HealthMesh-LinkChecker/1.0";

type ProgressCallback = (progress: BrokenLinkProgress) => Promise<void>;
type CancelCheck = () => Promise<boolean>;

interface LinkElementConfig {
  selector: string;
  attribute: "href" | "src";
}

const LINK_SELECTORS: LinkElementConfig[] = [
  { selector: "a[href]", attribute: "href" },
  { selector: "link[href]", attribute: "href" },
  { selector: "img[src]", attribute: "src" },
  { selector: "script[src]", attribute: "src" },
  { selector: "iframe[src]", attribute: "src" },
  { selector: "source[src]", attribute: "src" },
  { selector: "video[src]", attribute: "src" },
  { selector: "audio[src]", attribute: "src" },
];

async function fetchPageHtml(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractLinksFromHtml(
  html: string,
  sourcePageUrl: string,
  siteOrigin: string
): { pageLinks: ExtractedLink[]; internalPageUrls: string[] } {
  const $ = cheerio.load(html);
  const pageLinks: ExtractedLink[] = [];
  const internalPageUrls: string[] = [];

  for (const { selector, attribute } of LINK_SELECTORS) {
    $(selector).each((index, el) => {
      const raw = $(el).attr(attribute);
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) {
        return;
      }

      const normalized = normalizeUrl(raw, sourcePageUrl);
      if (!normalized) return;

      const tag = String($(el).prop("tagName") ?? "a").toLowerCase();
      const id = $(el).attr("id") ?? undefined;
      const className = $(el).attr("class") ?? undefined;
      const rel = $(el).attr("rel") ?? undefined;
      const text =
        tag === "a"
          ? $(el).text().trim().slice(0, 120) || undefined
          : $(el).attr("alt")?.trim() || $(el).attr("title")?.trim() || undefined;

      const internal = isSameOrigin(normalized, siteOrigin);

      pageLinks.push({
        href: normalized,
        sourcePageUrl,
        tag,
        id,
        className,
        text,
        selector: buildElementSelector(tag, id, className, index),
        attribute,
        isInternal: internal,
        resourceType: classifyLinkResource(tag, attribute, normalized, rel),
      });

      if (internal && attribute === "href" && isCrawlablePageUrl(normalized, siteOrigin)) {
        internalPageUrls.push(normalized);
      }
    });
  }

  return { pageLinks, internalPageUrls };
}

async function checkLink(
  href: string
): Promise<{ ok: boolean; statusCode: number | null; errorMessage: string | null }> {
  try {
    let res = await fetch(href, {
      method: "HEAD",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    if (res.status === 405 || res.status === 501) {
      res = await fetch(href, {
        method: "GET",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
    }

    const ok = res.status >= 200 && res.status < 400;
    return {
      ok,
      statusCode: res.status,
      errorMessage: ok ? null : `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      errorMessage: err instanceof Error ? err.message : "Request failed",
    };
  }
}

function buildWwwFallbackUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.hostname.startsWith("www.")) return null;
    url.hostname = `www.${url.hostname}`;
    return url.href;
  } catch {
    return null;
  }
}

function severityForStatus(statusCode: number | null): BrokenLinkFinding["severity"] {
  if (statusCode === 404 || statusCode === 410) return "CRITICAL";
  if (statusCode === null) return "MAJOR";
  if (statusCode >= 500) return "MAJOR";
  return "MINOR";
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
  shouldCancel?: CancelCheck
): Promise<void> {
  if (items.length === 0) return;

  let nextIndex = 0;
  let stopped = false;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!stopped) {
      if (shouldCancel && (await shouldCancel())) {
        stopped = true;
        return;
      }

      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;

      const current = items[currentIndex];
      if (current === undefined) continue;

      await worker(current);
    }
  });

  await Promise.all(runners);

  if (shouldCancel && (await shouldCancel())) {
    throw new ScanCancelledError();
  }
}

export async function runBrokenLinkScan(
  startUrl: string,
  mode: BrokenLinkScanMode,
  resourceTypes: LinkResourceType[],
  onProgress: ProgressCallback,
  shouldCancel?: CancelCheck
): Promise<BrokenLinkScanResult> {
  const normalizedStart = startUrl.startsWith("http") ? startUrl : `https://${startUrl}`;
  const siteOrigin = getOrigin(normalizedStart);
  const allowedTypes = new Set(resourceTypes);

  const visited = new Set<string>();
  const queue: string[] = [normalizedStart];
  const allExtractedLinks: ExtractedLink[] = [];

  await onProgress({
    phase: "initializing",
    statusMessage: `Starting ${mode.toLowerCase()} link scan for ${normalizedStart}`,
    pagesDiscovered: 1,
    pagesCrawled: 0,
    linksFound: 0,
    linksChecked: 0,
    brokenCount: 0,
    progressPercent: 0,
  });

  while (queue.length > 0) {
    if (shouldCancel && (await shouldCancel())) {
      throw new ScanCancelledError();
    }

    const batch: string[] = [];
    while (batch.length < CRAWL_CONCURRENCY && queue.length > 0) {
      const next = queue.shift()!;
      if (visited.has(next)) continue;
      visited.add(next);
      batch.push(next);
    }

    if (batch.length === 0) continue;

    await onProgress({
      phase: "crawling",
      statusMessage: `Crawling page ${visited.size}: ${batch[0]}`,
      pagesDiscovered: visited.size + queue.length,
      pagesCrawled: visited.size,
      linksFound: allExtractedLinks.length,
      linksChecked: 0,
      brokenCount: 0,
      progressPercent: Math.min(35, Math.round((visited.size / (visited.size + queue.length + 1)) * 35)),
    });

    await Promise.all(
      batch.map(async (pageUrl) => {
        const html = await fetchPageHtml(pageUrl);
        if (!html) return;

        const { pageLinks, internalPageUrls } = extractLinksFromHtml(
          html,
          pageUrl,
          siteOrigin
        );
        allExtractedLinks.push(...pageLinks);

        for (const internalUrl of internalPageUrls) {
          if (!visited.has(internalUrl) && !queue.includes(internalUrl)) {
            queue.push(internalUrl);
          }
        }
      })
    );
  }

  const linksToCheck = allExtractedLinks.filter((link) => {
    const scopeMatch = mode === "INTERNAL" ? link.isInternal : !link.isInternal;
    return scopeMatch && allowedTypes.has(link.resourceType);
  });

  const uniqueByHref = new Map<string, ExtractedLink[]>();
  for (const link of linksToCheck) {
    const existing = uniqueByHref.get(link.href) ?? [];
    existing.push(link);
    uniqueByHref.set(link.href, existing);
  }

  const uniqueHrefs = [...uniqueByHref.keys()];
  const findings: BrokenLinkFinding[] = [];
  const wwwFallbacks: WwwFallbackResolution[] = [];
  let linksChecked = 0;

  await onProgress({
    phase: "collecting",
    statusMessage: `Found ${uniqueHrefs.length} unique ${mode.toLowerCase()} links across ${visited.size} pages`,
    pagesDiscovered: visited.size,
    pagesCrawled: visited.size,
    linksFound: uniqueHrefs.length,
    linksChecked: 0,
    brokenCount: 0,
    progressPercent: 40,
  });

  try {
    await runPool(
      uniqueHrefs,
      CHECK_CONCURRENCY,
      async (targetHref) => {
        const occurrences = uniqueByHref.get(targetHref);
        if (!occurrences?.length) return;

        linksChecked += 1;
        const checkProgress = 40 + Math.round((linksChecked / Math.max(uniqueHrefs.length, 1)) * 60);

        await onProgress({
          phase: "checking",
          statusMessage: `Checking link ${linksChecked}/${uniqueHrefs.length}: ${targetHref}`,
          pagesDiscovered: visited.size,
          pagesCrawled: visited.size,
          linksFound: uniqueHrefs.length,
          linksChecked,
          brokenCount: findings.length,
          progressPercent: checkProgress,
        });

        const result = await checkLink(targetHref);
        if (!result.ok) {
          const fallbackHref = buildWwwFallbackUrl(targetHref);
          const fallbackResult = fallbackHref ? await checkLink(fallbackHref) : null;

          if (fallbackHref && fallbackResult?.ok) {
            wwwFallbacks.push({
              href: targetHref,
              fallbackHref,
              statusCode: result.statusCode,
              errorMessage: result.errorMessage,
            });
            return;
          }

          for (const occurrence of occurrences) {
            findings.push({
              href: occurrence.href,
              sourcePageUrl: occurrence.sourcePageUrl,
              statusCode: result.statusCode,
              errorMessage: result.errorMessage,
              elementTag: occurrence.tag,
              elementId: occurrence.id,
              elementClass: occurrence.className,
              elementText: occurrence.text,
              selector: occurrence.selector,
              attribute: occurrence.attribute,
              severity: severityForStatus(result.statusCode),
            });
          }
        }
      },
      shouldCancel
    );
  } catch (error) {
    if (error instanceof ScanCancelledError) {
      throw new ScanCancelledError(findings, wwwFallbacks);
    }
    throw error;
  }

  await onProgress({
    phase: "completed",
    statusMessage: `Scan complete — ${findings.length} broken ${mode.toLowerCase()} link(s) found`,
    pagesDiscovered: visited.size,
    pagesCrawled: visited.size,
    linksFound: uniqueHrefs.length,
    linksChecked,
    brokenCount: findings.length,
    progressPercent: 100,
  });

  return { findings, wwwFallbacks };
}
