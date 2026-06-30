import * as cheerio from "cheerio";
import type { Browser } from "puppeteer";
import type { BrokenLinkScanMode } from "@prisma/client";
import {
  type LinkResourceType,
  classifyLinkResource,
} from "./link-resource-types";
import {
  LINK_ELEMENT_CONFIGS,
  closeRenderedPageBrowser,
  createRenderedPageBrowser,
  fetchRenderedPageLinks,
  type RawDomLink,
} from "./rendered-page-fetcher";
import {
  buildElementSelector,
  getOrigin,
  isCrawlablePageUrl,
  isSameOrigin,
  isUncheckableRawLink,
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
const BROWSER_CRAWL_CONCURRENCY = 2;
const FETCH_CRAWL_CONCURRENCY = 4;
const CHECK_CONCURRENCY = 8;
const USER_AGENT = "LoopNode-LinkChecker/1.0";

type ProgressCallback = (progress: BrokenLinkProgress) => Promise<void>;
type CancelCheck = () => Promise<boolean>;

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

function mapRawLinksToExtracted(
  rawLinks: RawDomLink[],
  sourcePageUrl: string,
  siteOrigin: string
): { pageLinks: ExtractedLink[]; internalPageUrls: string[] } {
  const pageLinks: ExtractedLink[] = [];
  const internalPageUrls: string[] = [];

  for (const raw of rawLinks) {
    if (isUncheckableRawLink(raw.rawUrl)) continue;

    const normalized = normalizeUrl(raw.rawUrl, sourcePageUrl);
    if (!normalized) continue;

    const attribute = raw.attribute === "srcset" ? "src" : (raw.attribute as "href" | "src");
    const internal = isSameOrigin(normalized, siteOrigin);

    pageLinks.push({
      href: normalized,
      sourcePageUrl,
      tag: raw.tag,
      id: raw.id ?? undefined,
      className: raw.className ?? undefined,
      text: raw.text ?? undefined,
      selector: buildElementSelector(
        raw.tag,
        raw.id ?? undefined,
        raw.className ?? undefined,
        raw.index
      ),
      attribute,
      isInternal: internal,
      resourceType: classifyLinkResource(raw.tag, attribute, normalized, raw.rel ?? undefined),
    });

    if (internal && attribute === "href" && isCrawlablePageUrl(normalized, siteOrigin)) {
      internalPageUrls.push(normalized);
    }
  }

  return { pageLinks, internalPageUrls };
}

function extractLinksFromHtml(
  html: string,
  sourcePageUrl: string,
  siteOrigin: string
): { pageLinks: ExtractedLink[]; internalPageUrls: string[] } {
  const $ = cheerio.load(html);
  const pageLinks: ExtractedLink[] = [];
  const internalPageUrls: string[] = [];

  for (const { selector, attribute } of LINK_ELEMENT_CONFIGS) {
    $(selector).each((index, el) => {
      const raw = $(el).attr(attribute);
      if (!raw || isUncheckableRawLink(raw)) return;

      const normalized = normalizeUrl(raw, sourcePageUrl);
      if (!normalized) return;

      const tag = String($(el).prop("tagName") ?? "a").toLowerCase();
      const id = $(el).attr("id") ?? undefined;
      const className = $(el).attr("class") ?? undefined;
      const rel = $(el).attr("rel") ?? undefined;
      const resolvedAttribute = attribute === "data-href" || attribute === "data-src"
        ? attribute.endsWith("href") ? "href" : "src"
        : (attribute as "href" | "src");
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
        attribute: resolvedAttribute,
        isInternal: internal,
        resourceType: classifyLinkResource(tag, resolvedAttribute, normalized, rel),
      });

      if (internal && resolvedAttribute === "href" && isCrawlablePageUrl(normalized, siteOrigin)) {
        internalPageUrls.push(normalized);
      }

      if (tag === "img" || tag === "source") {
        const srcset = $(el).attr("srcset");
        if (srcset) {
          srcset.split(",").forEach((part, srcsetIndex) => {
            const candidate = part.trim().split(/\s+/)[0];
            if (!candidate) return;
            const srcNormalized = normalizeUrl(candidate, sourcePageUrl);
            if (!srcNormalized) return;

            pageLinks.push({
              href: srcNormalized,
              sourcePageUrl,
              tag,
              id,
              className,
              text,
              selector: buildElementSelector(tag, id, className, srcsetIndex),
              attribute: "src",
              isInternal: isSameOrigin(srcNormalized, siteOrigin),
              resourceType: classifyLinkResource(tag, "src", srcNormalized, rel),
            });
          });
        }
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

    const shouldTryGet =
      res.status === 405 ||
      res.status === 501 ||
      res.status === 403 ||
      res.status === 401;

    if (shouldTryGet) {
      res = await fetch(href, {
        method: "GET",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          "User-Agent": USER_AGENT,
          Range: "bytes=0-0",
        },
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

function findingFromOccurrence(
  occurrence: ExtractedLink,
  result: { statusCode: number | null; errorMessage: string | null }
): BrokenLinkFinding {
  return {
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
  };
}

function dedupeFindingsByHref(findings: BrokenLinkFinding[]): BrokenLinkFinding[] {
  const byHref = new Map<string, BrokenLinkFinding>();
  for (const finding of findings) {
    if (!byHref.has(finding.href)) {
      byHref.set(finding.href, finding);
    }
  }
  return [...byHref.values()];
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

  let browser: Browser | null = null;
  let useBrowserRendering = true;

  try {
    browser = await createRenderedPageBrowser();
  } catch (error) {
    useBrowserRendering = false;
    if (process.env.VERCEL) {
      throw new Error(
        "Headless Chrome is not available on Vercel. Enable USE_TRIGGER_DEV=true and deploy Trigger.dev tasks with: npx trigger.dev@latest deploy"
      );
    }
    console.warn(
      "[broken-links] Headless browser unavailable, falling back to static HTML fetch:",
      error instanceof Error ? error.message : error
    );
  }

  const crawlConcurrency = useBrowserRendering
    ? BROWSER_CRAWL_CONCURRENCY
    : FETCH_CRAWL_CONCURRENCY;

  await onProgress({
    phase: "initializing",
    statusMessage: useBrowserRendering
      ? `Starting ${mode.toLowerCase()} link scan with JavaScript rendering for ${normalizedStart}`
      : `Starting ${mode.toLowerCase()} link scan (static HTML) for ${normalizedStart}`,
    pagesDiscovered: 1,
    pagesCrawled: 0,
    linksFound: 0,
    linksChecked: 0,
    brokenCount: 0,
    progressPercent: 0,
  });

  try {
    while (queue.length > 0) {
      if (shouldCancel && (await shouldCancel())) {
        throw new ScanCancelledError();
      }

      const batch: string[] = [];
      while (batch.length < crawlConcurrency && queue.length > 0) {
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
          let pageLinks: ExtractedLink[] = [];
          let internalPageUrls: string[] = [];
          let crawledWithBrowser = false;

          if (useBrowserRendering && browser) {
            const rawLinks = await fetchRenderedPageLinks(browser, pageUrl);
            if (rawLinks) {
              crawledWithBrowser = true;
              ({ pageLinks, internalPageUrls } = mapRawLinksToExtracted(
                rawLinks,
                pageUrl,
                siteOrigin
              ));
            }
          }

          if (!crawledWithBrowser) {
            const html = await fetchPageHtml(pageUrl);
            if (!html) return;

            ({ pageLinks, internalPageUrls } = extractLinksFromHtml(
              html,
              pageUrl,
              siteOrigin
            ));
          }

          allExtractedLinks.push(...pageLinks);

          for (const internalUrl of internalPageUrls) {
            if (!visited.has(internalUrl) && !queue.includes(internalUrl)) {
              queue.push(internalUrl);
            }
          }
        })
      );
    }
  } finally {
    if (browser) {
      await closeRenderedPageBrowser(browser);
    }
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

          const representative = occurrences[0];
          if (representative) {
            findings.push(findingFromOccurrence(representative, result));
          }
        }
      },
      shouldCancel
    );
  } catch (error) {
    if (error instanceof ScanCancelledError) {
      throw new ScanCancelledError(dedupeFindingsByHref(findings), wwwFallbacks);
    }
    throw error;
  }

  const uniqueFindings = dedupeFindingsByHref(findings);

  await onProgress({
    phase: "completed",
    statusMessage: `Scan complete — ${uniqueFindings.length} broken ${mode.toLowerCase()} link(s) found`,
    pagesDiscovered: visited.size,
    pagesCrawled: visited.size,
    linksFound: uniqueHrefs.length,
    linksChecked,
    brokenCount: uniqueFindings.length,
    progressPercent: 100,
  });

  return { findings: uniqueFindings, wwwFallbacks };
}
