import { htmlToPdfBuffer } from "@/lib/reports/html-to-pdf";
import {
  renderAccessibilityReportHtml,
  renderExecutiveSummaryHtml,
  renderFullAuditHtml,
  renderPerformanceReportHtml,
  renderSecurityReportHtml,
  renderSeoReportHtml,
} from "@/lib/reports/render-branded-report-html";
import { buildReportTitle, type ReportScanContext } from "@/lib/reports/types";
import type { ReportType } from "@prisma/client";

const PDF_RENDERERS: Partial<Record<ReportType, (ctx: ReportScanContext) => string>> = {
  FULL_AUDIT: renderFullAuditHtml,
  EXECUTIVE_SUMMARY: renderExecutiveSummaryHtml,
  PERFORMANCE_REPORT: renderPerformanceReportHtml,
  SEO_REPORT: renderSeoReportHtml,
  SECURITY_REPORT: renderSecurityReportHtml,
  ACCESSIBILITY_REPORT: renderAccessibilityReportHtml,
};

export async function generateReportPdf(type: ReportType, context: ReportScanContext) {
  const render = PDF_RENDERERS[type];
  if (!render) {
    throw new Error("Unsupported PDF report type.");
  }
  return htmlToPdfBuffer(render(context));
}

export async function generateFullAuditPdf(context: ReportScanContext) {
  return generateReportPdf("FULL_AUDIT", context);
}

export async function generateExecutiveSummaryPdf(context: ReportScanContext) {
  return generateReportPdf("EXECUTIVE_SUMMARY", context);
}

export { buildReportTitle };
