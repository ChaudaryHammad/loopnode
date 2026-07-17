import type { IssueCategory, IssueSeverity } from "@prisma/client";
import type { ScanIssueInput } from "@/lib/scanner/types";

export const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  CRITICAL: 0,
  MAJOR: 1,
  MINOR: 2,
  INFO: 3,
};

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  PERFORMANCE: "Performance",
  ACCESSIBILITY: "Accessibility",
  SEO: "SEO",
  SECURITY: "Security",
  BROKEN_LINKS: "Coverage",
};

export function computeIssueFingerprint(issue: {
  category: IssueCategory | ScanIssueInput["category"];
  title: string;
  selector?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const selector = issue.selector?.trim() ?? "";
  const url = issue.url?.trim() ?? "";
  const meta = issue.metadata;
  const stableId =
    (typeof meta?.lighthouseAuditId === "string" && meta.lighthouseAuditId) ||
    (typeof meta?.axeId === "string" && meta.axeId) ||
    "";
  return `${issue.category}|${stableId}|${issue.title.trim()}|${selector}|${url}`;
}

export function categoryToAuditPath(websiteId: string, category: IssueCategory) {
  const paths: Record<IssueCategory, string> = {
    PERFORMANCE: `/dashboard/websites/${websiteId}/performance`,
    ACCESSIBILITY: `/dashboard/websites/${websiteId}/accessibility`,
    SEO: `/dashboard/websites/${websiteId}/seo`,
    SECURITY: `/dashboard/websites/${websiteId}/security`,
    BROKEN_LINKS: `/dashboard/websites/${websiteId}/coverage`,
  };
  return paths[category];
}

export function sortIssuesBySeverity<T extends { severity: IssueSeverity }>(issues: T[]) {
  return [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}
