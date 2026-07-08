import type { IssueSeverity } from "@prisma/client";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";

export interface BrokenLinkProgress {
  phase: "initializing" | "crawling" | "collecting" | "checking" | "completed" | "failed";
  statusMessage: string;
  pagesDiscovered: number;
  pagesCrawled: number;
  linksFound: number;
  linksChecked: number;
  brokenCount: number;
  progressPercent: number;
  capped?: boolean;
}

export interface ExtractedLink {
  href: string;
  sourcePageUrl: string;
  tag: string;
  id?: string;
  className?: string;
  text?: string;
  selector: string;
  attribute: "href" | "src";
  isInternal: boolean;
  resourceType: LinkResourceType;
}

export interface BrokenLinkFinding {
  href: string;
  sourcePageUrl: string;
  statusCode: number | null;
  errorMessage: string | null;
  elementTag: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  selector: string;
  attribute: string;
  severity: IssueSeverity;
}

export interface WwwFallbackResolution {
  href: string;
  fallbackHref: string;
  statusCode: number | null;
  errorMessage: string | null;
}

export interface BrokenLinkScanResult {
  findings: BrokenLinkFinding[];
  wwwFallbacks: WwwFallbackResolution[];
  pagesCrawled: number;
  linksChecked: number;
  uniqueBrokenCount: number;
  occurrenceCount: number;
  capped: boolean;
}

export interface BrokenLinkEngineBudgets {
  /** When null, crawl until the domain queue is empty. */
  maxPages: number | null;
  /** When null, verify every unique link discovered. */
  maxLinksToCheck: number | null;
  crawlConcurrency: number;
  checkConcurrency: number;
  fetchTimeoutMs: number;
}

/** Domain-bound crawl — no artificial page/link caps. */
export const DOMAIN_BROKEN_LINK_BUDGETS: BrokenLinkEngineBudgets = {
  maxPages: null,
  maxLinksToCheck: null,
  crawlConcurrency: 6,
  checkConcurrency: 12,
  fetchTimeoutMs: 10000,
};

/** @deprecated Use DOMAIN_BROKEN_LINK_BUDGETS */
export const DEFAULT_BROKEN_LINK_BUDGETS = {
  maxPages: null as number | null,
  maxLinksToCheck: null as number | null,
  crawlConcurrency: DOMAIN_BROKEN_LINK_BUDGETS.crawlConcurrency,
  checkConcurrency: DOMAIN_BROKEN_LINK_BUDGETS.checkConcurrency,
  fetchTimeoutMs: DOMAIN_BROKEN_LINK_BUDGETS.fetchTimeoutMs,
};
