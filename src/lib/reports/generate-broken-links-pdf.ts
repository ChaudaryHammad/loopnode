import { htmlToPdfBuffer } from "@/lib/reports/html-to-pdf";
import { renderBrokenLinksHtml } from "@/lib/reports/render-broken-links-html";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";

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
  findings: BrokenLinkFinding[];
};

export async function generateBrokenLinksPdf(input: BrokenLinksReportInput) {
  return htmlToPdfBuffer(renderBrokenLinksHtml(input));
}
