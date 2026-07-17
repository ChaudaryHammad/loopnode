/**
 * One-off verification: render redesigned Full Audit + Executive Summary PDFs.
 * Run: npx tsx scripts/verify-report-pdfs.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Issue, Scan, Website } from "@prisma/client";
import { buildAuditReportPdfBuffer } from "../src/lib/reports/pdf/audit-document";
import type { ReportScanContext, ScanWithIssues } from "../src/lib/reports/types";

function mockIssue(
  partial: Pick<Issue, "category" | "severity" | "title"> &
    Partial<Pick<Issue, "description" | "selector" | "url" | "recommendation">>,
): Issue {
  return {
    id: `issue-${partial.title}`,
    scanId: "scan-current",
    category: partial.category,
    severity: partial.severity,
    status: "OPEN",
    fingerprint: `${partial.category}|${partial.title}`,
    title: partial.title,
    description: partial.description ?? "Sample description for layout verification.",
    selector: partial.selector ?? "main > .hero",
    url: partial.url ?? "https://example.com/pricing",
    recommendation: partial.recommendation ?? "Apply the recommended fix and re-scan.",
    metadata: null,
    acknowledgedAt: null,
    resolvedAt: null,
    createdAt: new Date("2026-07-01T12:00:00Z"),
  };
}

function mockScan(id: string, scores: Partial<Scan>, issues: Issue[]): ScanWithIssues {
  return {
    id,
    websiteId: "site-1",
    status: "COMPLETED",
    overallScore: scores.overallScore ?? 72,
    performanceScore: scores.performanceScore ?? 68,
    accessibilityScore: scores.accessibilityScore ?? 81,
    seoScore: scores.seoScore ?? 90,
    securityScore: scores.securityScore ?? 55,
    fcp: scores.fcp ?? 1800,
    lcp: scores.lcp ?? 3200,
    cls: scores.cls ?? 0.12,
    inp: scores.inp ?? 240,
    tbt: scores.tbt ?? 380,
    phase: null,
    statusMessage: null,
    progressPercent: 100,
    triggerRunId: null,
    screenshot: null,
    lighthouseReportUrl: null,
    labEngine: "lighthouse",
    device: "desktop",
    startedAt: new Date("2026-07-10T10:00:00Z"),
    completedAt: new Date("2026-07-10T10:05:00Z"),
    errorMessage: null,
    createdAt: new Date("2026-07-10T10:00:00Z"),
    updatedAt: new Date("2026-07-10T10:05:00Z"),
    issues,
  };
}

const issues: Issue[] = [
  mockIssue({
    category: "PERFORMANCE",
    severity: "CRITICAL",
    title: "Largest Contentful Paint is too slow",
    recommendation: "Compress the hero image and preload the LCP resource.",
  }),
  mockIssue({
    category: "PERFORMANCE",
    severity: "MAJOR",
    title: "Total Blocking Time exceeds budget",
  }),
  mockIssue({
    category: "ACCESSIBILITY",
    severity: "CRITICAL",
    title: "Images missing accessible names",
    selector: "img.hero-banner",
  }),
  mockIssue({
    category: "ACCESSIBILITY",
    severity: "MINOR",
    title: "Low contrast text on buttons",
  }),
  mockIssue({
    category: "SEO",
    severity: "MAJOR",
    title: "Missing meta description on key pages",
    url: "https://example.com/about",
  }),
  mockIssue({
    category: "SECURITY",
    severity: "CRITICAL",
    title: "Content-Security-Policy header missing",
    recommendation: "Add a strict CSP and report-only mode first.",
  }),
  mockIssue({
    category: "SECURITY",
    severity: "MAJOR",
    title: "HSTS not enabled",
  }),
];

const website: Pick<Website, "id" | "name" | "url"> = {
  id: "site-1",
  name: "Acme Marketing Site",
  url: "https://example.com",
};

const previous = mockScan(
  "scan-prev",
  {
    overallScore: 78,
    performanceScore: 74,
    accessibilityScore: 80,
    seoScore: 88,
    securityScore: 60,
  },
  [],
);

const current = mockScan(
  "scan-current",
  {
    overallScore: 72,
    performanceScore: 68,
    accessibilityScore: 81,
    seoScore: 90,
    securityScore: 55,
  },
  issues,
);

const context: ReportScanContext = {
  website,
  scan: current,
  previousScan: previous,
};

async function main() {
  const outDir = join(process.cwd(), "tmp", "report-pdf-verify");
  mkdirSync(outDir, { recursive: true });

  const full = await buildAuditReportPdfBuffer("FULL_AUDIT", context);
  const exec = await buildAuditReportPdfBuffer("EXECUTIVE_SUMMARY", context);
  const perf = await buildAuditReportPdfBuffer("PERFORMANCE_REPORT", context);
  const seo = await buildAuditReportPdfBuffer("SEO_REPORT", context);
  const sec = await buildAuditReportPdfBuffer("SECURITY_REPORT", context);
  const a11y = await buildAuditReportPdfBuffer("ACCESSIBILITY_REPORT", context);

  const fullPath = join(outDir, "full-audit.pdf");
  const execPath = join(outDir, "executive-summary.pdf");
  const perfPath = join(outDir, "performance.pdf");
  const seoPath = join(outDir, "seo.pdf");
  const secPath = join(outDir, "security.pdf");
  const a11yPath = join(outDir, "accessibility.pdf");

  writeFileSync(fullPath, full);
  writeFileSync(execPath, exec);
  writeFileSync(perfPath, perf);
  writeFileSync(seoPath, seo);
  writeFileSync(secPath, sec);
  writeFileSync(a11yPath, a11y);

  console.log("Wrote:");
  for (const [label, buf, path] of [
    ["full", full, fullPath],
    ["exec", exec, execPath],
    ["perf", perf, perfPath],
    ["seo", seo, seoPath],
    ["sec", sec, secPath],
    ["a11y", a11y, a11yPath],
  ] as const) {
    console.log(`  ${path} (${buf.byteLength} bytes)`);
    if (buf.byteLength < 800 || buf[0] !== 0x25) throw new Error(`Bad PDF: ${label}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
