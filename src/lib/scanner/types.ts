import type { IssueSeverity } from "@prisma/client";
import type { LinkResourceType } from "./link-resource-types";

export interface ScanIssueInput {
  category: "PERFORMANCE" | "ACCESSIBILITY" | "SEO" | "SECURITY";
  severity: IssueSeverity;
  title: string;
  description: string;
  selector?: string | null;
  url?: string | null;
  recommendation?: string | null;
  metadata?: Record<string, unknown>;
}

export type PerformanceIssueKind =
  | "resource-waste"
  | "image-delivery"
  | "render-blocking"
  | "metric"
  | "font"
  | "layout"
  | "cache"
  | "network"
  | "general";

export interface PerformanceIssueOffender {
  label: string;
  url: string | null;
  wastedBytes: number | null;
  wastedMs: number | null;
  transferSize: number | null;
  totalBytes: number | null;
  snippet: string | null;
}

export interface PerformanceIssueMetadata {
  [key: string]: unknown;
  version: 1;
  source: "lighthouse" | "fallback";
  lighthouseAuditId?: string | null;
  lighthouseCategory?: string | null;
  kind: PerformanceIssueKind;
  score: number | null;
  scoreDisplayMode: string | null;
  displayValue: string | null;
  numericValue: number | null;
  estimatedSavingsMs: number | null;
  estimatedSavingsBytes: number | null;
  summary: string;
  impact: string | null;
  primaryAction: string | null;
  headings: string[];
  topOffenders: PerformanceIssueOffender[];
  url: string | null;
}

export interface AuditResult {
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  securityScore: number;
  overallScore: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  issues: ScanIssueInput[];
}

export interface BrokenLinkProgress {
  phase: "initializing" | "crawling" | "collecting" | "checking" | "completed" | "failed";
  statusMessage: string;
  pagesDiscovered: number;
  pagesCrawled: number;
  linksFound: number;
  linksChecked: number;
  brokenCount: number;
  progressPercent: number;
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
}
