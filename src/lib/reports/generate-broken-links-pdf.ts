import { buildBrokenLinksPdfBuffer } from "@/lib/reports/pdf/broken-links-document";
import {
  groupBrokenLinkFindings,
  type GroupedBrokenLink,
} from "@/broken-links/group-results";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";

/** Keep react-pdf render within serverless time/memory limits. */
export const BROKEN_LINKS_PDF_MAX_GROUPS = 200;
export const BROKEN_LINKS_PDF_MAX_PAGES_PER_URL = 8;

export type BrokenLinkFinding = {
  href: string;
  sourcePageUrl: string;
  statusCode: number | null;
  errorMessage: string | null;
  elementTag: string | null;
  elementId: string | null;
  elementClass: string | null;
  elementText: string | null;
  selector: string | null;
  attribute: string | null;
  severity: string;
};

export type BrokenLinksReportInput = {
  websiteName: string;
  websiteUrl: string;
  mode: string;
  resourceTypes: LinkResourceType[];
  completedAt: string | null;
  pagesCrawled: number;
  linksChecked: number;
  brokenCount: number;
  occurrenceCount: number;
  groups: GroupedBrokenLink[];
  /** When groups were capped for PDF size. */
  findingsTruncated?: boolean;
  totalBrokenUnique?: number;
};

export function prepareBrokenLinksPdfGroups(
  findings: BrokenLinkFinding[],
  maxGroups = BROKEN_LINKS_PDF_MAX_GROUPS,
  maxPagesPerUrl = BROKEN_LINKS_PDF_MAX_PAGES_PER_URL
): {
  groups: GroupedBrokenLink[];
  totalUnique: number;
  totalOccurrences: number;
  truncated: boolean;
} {
  const grouped = groupBrokenLinkFindings(
    findings.map((f) => ({
      href: f.href,
      sourcePageUrl: f.sourcePageUrl,
      statusCode: f.statusCode,
      errorMessage: f.errorMessage,
      elementTag: f.elementTag ?? "a",
      elementId: f.elementId ?? undefined,
      elementClass: f.elementClass ?? undefined,
      elementText: f.elementText ?? undefined,
      selector: f.selector ?? "",
      attribute: f.attribute ?? "href",
      severity: f.severity as "CRITICAL" | "MAJOR" | "MINOR" | "INFO",
    }))
  );

  const totalOccurrences = findings.length;
  const truncated = grouped.length > maxGroups;

  const groups = grouped.slice(0, maxGroups).map((group) => ({
    ...group,
    occurrences: group.occurrences.slice(0, maxPagesPerUrl),
  }));

  return {
    groups,
    totalUnique: grouped.length,
    totalOccurrences,
    truncated,
  };
}

export async function generateBrokenLinksPdf(input: BrokenLinksReportInput) {
  return buildBrokenLinksPdfBuffer(input);
}
