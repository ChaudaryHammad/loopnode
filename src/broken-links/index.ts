import type { BrokenLinkScanMode } from "@prisma/client";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";
import { getOrigin } from "@/lib/scanner/url-utils";
import { ScanCancelledError } from "@/lib/scanner/scan-errors";
import { extractLinksFromHtml, filterLinksForCheck } from "./extract";
import {
  buildWwwFallbackUrl,
  checkLink,
  fetchPageHtml,
  severityForStatus,
} from "./http";
import { runPool } from "./pool";
import {
  DOMAIN_BROKEN_LINK_BUDGETS,
  type BrokenLinkEngineBudgets,
  type BrokenLinkFinding,
  type BrokenLinkProgress,
  type BrokenLinkScanResult,
  type ExtractedLink,
  type WwwFallbackResolution,
} from "./types";

type ProgressCallback = (progress: BrokenLinkProgress) => Promise<void> | void;
type CancelCheck = () => Promise<boolean>;

export interface RunBrokenLinkEngineOptions {
  startUrl: string;
  mode: BrokenLinkScanMode;
  resourceTypes: LinkResourceType[];
  onProgress: ProgressCallback;
  shouldCancel?: CancelCheck;
  budgets?: Partial<BrokenLinkEngineBudgets>;
  /** Called whenever new broken findings are produced (for batch DB persist). */
  onFindings?: (findings: BrokenLinkFinding[]) => void;
}

function crawlProgressPercent(pagesCrawled: number): number {
  if (pagesCrawled <= 0) return 2;
  return Math.min(38, 2 + Math.round(Math.log10(pagesCrawled + 1) * 11));
}

function canEnqueueMore(
  visited: number,
  queueLength: number,
  maxPages: number | null
): boolean {
  if (maxPages == null) return true;
  return visited + queueLength < maxPages;
}

/**
 * Broken Link Check engine — separate product from Audit Scan Engine.
 * Crawls same-origin pages until the queue is empty (domain-bound).
 */
export async function runBrokenLinkEngine(
  options: RunBrokenLinkEngineOptions
): Promise<BrokenLinkScanResult> {
  const budgets: BrokenLinkEngineBudgets = {
    ...DOMAIN_BROKEN_LINK_BUDGETS,
    ...options.budgets,
  };
  const normalizedStart = options.startUrl.startsWith("http")
    ? options.startUrl
    : `https://${options.startUrl}`;
  const siteOrigin = getOrigin(normalizedStart);

  const visited = new Set<string>();
  const queued = new Set<string>([normalizedStart]);
  const queue: string[] = [normalizedStart];
  const allExtractedLinks: ExtractedLink[] = [];
  let capped = false;

  await options.onProgress({
    phase: "initializing",
    statusMessage: `Starting ${options.mode.toLowerCase()} link check for ${normalizedStart}`,
    pagesDiscovered: 1,
    pagesCrawled: 0,
    linksFound: 0,
    linksChecked: 0,
    brokenCount: 0,
    progressPercent: 2,
  });

  while (queue.length > 0) {
    if (options.shouldCancel && (await options.shouldCancel())) {
      throw new ScanCancelledError();
    }

    if (budgets.maxPages != null && visited.size >= budgets.maxPages) {
      capped = true;
      break;
    }

    const batch: string[] = [];
    while (
      batch.length < budgets.crawlConcurrency &&
      queue.length > 0 &&
      (budgets.maxPages == null || visited.size + batch.length < budgets.maxPages)
    ) {
      const next = queue.shift()!;
      queued.delete(next);
      if (visited.has(next)) continue;
      visited.add(next);
      batch.push(next);
    }

    if (batch.length === 0) continue;

    await options.onProgress({
      phase: "crawling",
      statusMessage: `Crawling ${visited.size} pages · ${queue.length} queued · ${batch[0]}`,
      pagesDiscovered: visited.size + queue.length,
      pagesCrawled: visited.size,
      linksFound: allExtractedLinks.length,
      linksChecked: 0,
      brokenCount: 0,
      progressPercent: crawlProgressPercent(visited.size),
      capped,
    });

    await Promise.all(
      batch.map(async (pageUrl) => {
        const html = await fetchPageHtml(pageUrl, budgets.fetchTimeoutMs);
        if (!html) return;

        const { pageLinks, internalPageUrls } = extractLinksFromHtml(
          html,
          pageUrl,
          siteOrigin
        );
        allExtractedLinks.push(...pageLinks);

        for (const internalUrl of internalPageUrls) {
          if (visited.has(internalUrl) || queued.has(internalUrl)) continue;
          if (!canEnqueueMore(visited.size, queue.length, budgets.maxPages)) {
            capped = true;
            continue;
          }
          queued.add(internalUrl);
          queue.push(internalUrl);
        }
      })
    );
  }

  if (budgets.maxPages != null && queue.length > 0) capped = true;

  const linksToCheck = filterLinksForCheck(
    allExtractedLinks,
    options.mode,
    options.resourceTypes
  );

  const uniqueByHref = new Map<string, ExtractedLink[]>();
  for (const link of linksToCheck) {
    const existing = uniqueByHref.get(link.href) ?? [];
    existing.push(link);
    uniqueByHref.set(link.href, existing);
  }

  let uniqueHrefs = [...uniqueByHref.keys()];
  if (budgets.maxLinksToCheck != null && uniqueHrefs.length > budgets.maxLinksToCheck) {
    uniqueHrefs = uniqueHrefs.slice(0, budgets.maxLinksToCheck);
    capped = true;
  }

  const findings: BrokenLinkFinding[] = [];
  const brokenHrefs = new Set<string>();
  const wwwFallbacks: WwwFallbackResolution[] = [];
  let linksChecked = 0;

  await options.onProgress({
    phase: "collecting",
    statusMessage: capped
      ? `Found ${uniqueHrefs.length} links across ${visited.size} pages (partial) — verifying…`
      : `Found ${uniqueHrefs.length} unique ${options.mode.toLowerCase()} links across ${visited.size} pages`,
    pagesDiscovered: visited.size,
    pagesCrawled: visited.size,
    linksFound: uniqueHrefs.length,
    linksChecked: 0,
    brokenCount: 0,
    progressPercent: 42,
    capped,
  });

  try {
    await runPool(
      uniqueHrefs,
      budgets.checkConcurrency,
      async (targetHref) => {
        const occurrences = uniqueByHref.get(targetHref);
        if (!occurrences?.length) return;

        linksChecked += 1;
        const checkProgress =
          42 + Math.round((linksChecked / Math.max(uniqueHrefs.length, 1)) * 56);

        await options.onProgress({
          phase: "checking",
          statusMessage: `Checking ${linksChecked}/${uniqueHrefs.length}: ${targetHref}`,
          pagesDiscovered: visited.size,
          pagesCrawled: visited.size,
          linksFound: uniqueHrefs.length,
          linksChecked,
          brokenCount: brokenHrefs.size,
          progressPercent: checkProgress,
          capped,
        });

        const result = await checkLink(targetHref, budgets.fetchTimeoutMs);
        if (!result.ok) {
          const fallbackHref = buildWwwFallbackUrl(targetHref);
          const fallbackResult = fallbackHref
            ? await checkLink(fallbackHref, budgets.fetchTimeoutMs)
            : null;

          if (fallbackHref && fallbackResult?.ok) {
            wwwFallbacks.push({
              href: targetHref,
              fallbackHref,
              statusCode: result.statusCode,
              errorMessage: result.errorMessage,
            });
            return;
          }

          const batch: BrokenLinkFinding[] = occurrences.map((occurrence) => ({
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
          }));

          findings.push(...batch);
          brokenHrefs.add(targetHref);
          options.onFindings?.(batch);
        }
      },
      options.shouldCancel
    );
  } catch (error) {
    if (error instanceof ScanCancelledError) {
      throw new ScanCancelledError(findings, wwwFallbacks);
    }
    throw error;
  }

  const uniqueBrokenCount = brokenHrefs.size;

  await options.onProgress({
    phase: "completed",
    statusMessage: capped
      ? `Complete (partial) — ${uniqueBrokenCount} broken URL(s), ${findings.length} occurrence(s)`
      : `Scan complete — ${uniqueBrokenCount} broken URL(s), ${findings.length} occurrence(s)`,
    pagesDiscovered: visited.size,
    pagesCrawled: visited.size,
    linksFound: uniqueHrefs.length,
    linksChecked,
    brokenCount: uniqueBrokenCount,
    progressPercent: 100,
    capped,
  });

  return {
    findings,
    wwwFallbacks,
    pagesCrawled: visited.size,
    linksChecked,
    uniqueBrokenCount,
    occurrenceCount: findings.length,
    capped,
  };
}
