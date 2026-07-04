import type { Issue, IssueCategory } from "@prisma/client";
import { SEVERITY_ORDER } from "@/lib/issues";

/** Known high-signal issues surfaced first in report headers and library rows. */
const HEADLINE_PRIORITY: { pattern: RegExp; rank: number }[] = [
  { pattern: /content-security-policy|csp/i, rank: 0 },
  { pattern: /robots\.txt/i, rank: 1 },
  { pattern: /sitemap/i, rank: 2 },
  { pattern: /strict-transport-security|hsts/i, rank: 3 },
  { pattern: /not served over https|mixed content/i, rank: 4 },
  { pattern: /x-frame-options/i, rank: 5 },
  { pattern: /largest contentful paint|lcp/i, rank: 6 },
  { pattern: /cumulative layout shift|cls/i, rank: 7 },
  { pattern: /missing document title|meta description/i, rank: 8 },
  { pattern: /canonical/i, rank: 9 },
];

function headlineRank(title: string) {
  for (const { pattern, rank } of HEADLINE_PRIORITY) {
    if (pattern.test(title)) return rank;
  }
  return 100;
}

export function headlineShortLabel(title: string) {
  if (/content-security-policy|csp:/i.test(title)) return "Missing CSP";
  if (/robots\.txt not found|robots\.txt unreachable/i.test(title)) return "Missing robots.txt";
  if (/sitemap\.xml not found|sitemap\.xml unreachable/i.test(title)) return "Missing sitemap";
  if (/strict-transport-security|hsts/i.test(title)) return "Missing HSTS";
  if (/not served over https/i.test(title)) return "Not on HTTPS";
  if (/x-frame-options/i.test(title)) return "Missing X-Frame-Options";
  if (/largest contentful paint/i.test(title)) return "Slow LCP";
  if (/cumulative layout shift/i.test(title)) return "High CLS";
  if (/missing document title/i.test(title)) return "Missing title tag";
  if (/missing meta description/i.test(title)) return "Missing meta description";
  if (title.length > 36) return `${title.slice(0, 35)}…`;
  return title;
}

export function getHeadlineIssues(
  issues: Issue[],
  options?: { limit?: number; category?: IssueCategory }
) {
  const limit = options?.limit ?? 8;
  const category = options?.category;

  let pool = issues.filter(
    (issue) => issue.severity === "CRITICAL" || issue.severity === "MAJOR"
  );
  if (category) {
    pool = pool.filter((issue) => issue.category === category);
  }

  return [...pool]
    .sort((a, b) => {
      const rankDiff = headlineRank(a.title) - headlineRank(b.title);
      if (rankDiff !== 0) return rankDiff;
      const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

export function getHeadlineLabels(issues: Issue[], options?: Parameters<typeof getHeadlineIssues>[1]) {
  return getHeadlineIssues(issues, options).map((issue) => headlineShortLabel(issue.title));
}
