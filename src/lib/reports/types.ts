import type { Issue, ReportType, Scan, Website } from "@prisma/client";
import { CATEGORY_LABELS } from "@/lib/issues";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  FULL_AUDIT: "Full audit",
  EXECUTIVE_SUMMARY: "Executive summary",
  ISSUES_CSV: "Issues CSV",
  PERFORMANCE_REPORT: "Performance",
  SEO_REPORT: "SEO",
  SECURITY_REPORT: "Security",
  ACCESSIBILITY_REPORT: "Accessibility",
};

export const REPORT_TYPE_GROUPS: { label: string; types: ReportType[] }[] = [
  { label: "Overview", types: ["FULL_AUDIT", "EXECUTIVE_SUMMARY"] },
  { label: "By category", types: ["PERFORMANCE_REPORT", "SEO_REPORT", "SECURITY_REPORT", "ACCESSIBILITY_REPORT"] },
  { label: "Export", types: ["ISSUES_CSV"] },
];

export const REPORT_TYPE_STYLES: Record<ReportType, string> = {
  FULL_AUDIT: "bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700",
  EXECUTIVE_SUMMARY: "bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700",
  ISSUES_CSV: "bg-emerald-500/10 text-emerald-800 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800",
  PERFORMANCE_REPORT: "bg-amber-500/10 text-amber-900 border-amber-200 dark:text-amber-300 dark:border-amber-800",
  SEO_REPORT: "bg-blue-500/10 text-blue-900 border-blue-200 dark:text-blue-300 dark:border-blue-800",
  SECURITY_REPORT: "bg-red-500/10 text-red-900 border-red-200 dark:text-red-300 dark:border-red-800",
  ACCESSIBILITY_REPORT: "bg-violet-500/10 text-violet-900 border-violet-200 dark:text-violet-300 dark:border-violet-800",
};

export type ScanWithIssues = Scan & {
  issues: Issue[];
};

export type ReportScanContext = {
  website: Pick<Website, "id" | "name" | "url">;
  scan: ScanWithIssues;
  previousScan: ScanWithIssues | null;
};

export function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return String(Math.round(value));
}

export function scoreDelta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return Math.round(current - previous);
}

export function buildReportTitle(
  type: ReportType,
  websiteName: string,
  scanDate: Date | null
) {
  const dateLabel = scanDate
    ? scanDate.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  switch (type) {
    case "FULL_AUDIT":
      return `Full audit — ${websiteName} — ${dateLabel}`;
    case "EXECUTIVE_SUMMARY":
      return `Executive summary — ${websiteName} — ${dateLabel}`;
    case "ISSUES_CSV":
      return `Issues CSV — ${websiteName} — ${dateLabel}`;
    case "PERFORMANCE_REPORT":
      return `Performance — ${websiteName} — ${dateLabel}`;
    case "SEO_REPORT":
      return `SEO — ${websiteName} — ${dateLabel}`;
    case "SECURITY_REPORT":
      return `Security — ${websiteName} — ${dateLabel}`;
    case "ACCESSIBILITY_REPORT":
      return `Accessibility — ${websiteName} — ${dateLabel}`;
    default:
      return `Report — ${websiteName} — ${dateLabel}`;
  }
}

export function groupIssuesByCategory(issues: Issue[]) {
  return issues.reduce(
    (acc, issue) => {
      const key = issue.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(issue);
      return acc;
    },
    {} as Record<Issue["category"], Issue[]>
  );
}

export function getTopIssues(issues: Issue[], limit = 5) {
  const order = { CRITICAL: 0, MAJOR: 1, MINOR: 2, INFO: 3 };
  return [...issues]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, limit);
}

export function categoryLabel(category: Issue["category"]) {
  return CATEGORY_LABELS[category] ?? category;
}

export function isPdfReportType(type: ReportType) {
  return type !== "ISSUES_CSV";
}
