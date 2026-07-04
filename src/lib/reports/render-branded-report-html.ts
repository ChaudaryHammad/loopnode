import type { Issue, IssueCategory } from "@prisma/client";
import {
  dedupeIssuesByTitle,
  formatIssueLocationHtml,
} from "@/lib/reports/format-issue-location";
import { getHeadlineIssues } from "@/lib/reports/report-highlights";
import {
  escapeHtml,
  formatScanDate,
  LOOPNODE_BRAND,
  renderFooter,
  renderPageHeader,
  wrapDocument,
} from "@/lib/reports/report-html-shared";
import {
  categoryLabel,
  formatScore,
  getTopIssues,
  groupIssuesByCategory,
  scoreDelta,
  type ReportScanContext,
} from "@/lib/reports/types";

const SEVERITY_ORDER = { CRITICAL: 0, MAJOR: 1, MINOR: 2, INFO: 3 } as const;

const GENERIC_FIX_PATTERNS = [
  /^see https?:\/\//i,
  /for remediation guidance/i,
  /learn more at/i,
  /refer to (the )?documentation/i,
  /^see [a-z0-9.-]+\.[a-z]{2,}/i,
];

function isGenericRecommendation(text: string) {
  return GENERIC_FIX_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

/** Prefer concrete fix steps over "See documentation…" boilerplate. */
export function formatActionableFix(issue: Issue): string {
  const recommendation = issue.recommendation?.trim() ?? "";
  const description = issue.description?.trim() ?? "";

  if (recommendation && !isGenericRecommendation(recommendation)) {
    return recommendation;
  }

  const parts: string[] = [];

  if (description && description.toLowerCase() !== issue.title.toLowerCase()) {
    parts.push(description);
  }

  if (issue.selector) {
    const meta = issue.metadata as { elementId?: string; elementClass?: string; elementTag?: string } | null;
    const hints: string[] = [];
    if (meta?.elementTag) hints.push(`<${meta.elementTag}>`);
    if (meta?.elementId) hints.push(`#${meta.elementId}`);
    if (meta?.elementClass) hints.push(`.${meta.elementClass.split(/\s+/)[0]}`);
    const hint = hints.length > 0 ? ` (${hints.join(" ")})` : "";
    parts.push(`Find the element${hint} matching \`${issue.selector}\` in your markup.`);
  }

  if (issue.url) {
    parts.push(`Check the resource at ${issue.url}.`);
  }

  if (parts.length === 0) {
    return `Resolve "${issue.title}" in the ${categoryLabel(issue.category).toLowerCase()} layer of your site.`;
  }

  return parts.join(" ");
}

function sortIssues(issues: Issue[]) {
  return [...issues].sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sev !== 0) return sev;
    return a.title.localeCompare(b.title);
  });
}

function categoryScore(scan: ReportScanContext["scan"], category: IssueCategory) {
  switch (category) {
    case "PERFORMANCE":
      return scan.performanceScore;
    case "ACCESSIBILITY":
      return scan.accessibilityScore;
    case "SEO":
      return scan.seoScore;
    case "SECURITY":
      return scan.securityScore;
    default:
      return scan.overallScore;
  }
}

function renderHeadlineBlock(issues: Issue[], category?: IssueCategory) {
  const headlines = dedupeIssuesByTitle(getHeadlineIssues(issues, { limit: 8, category }));
  if (headlines.length === 0) {
    return "";
  }

  const items = headlines
    .map((issue) => {
      const sev = issue.severity === "CRITICAL" ? "Critical" : "Major";
      return `<li><strong>${sev}:</strong> ${escapeHtml(issue.title)}</li>`;
    })
    .join("");

  return `<div class="headline-box"><div class="headline-title">Priority issues — fix first</div><ul class="headline-list">${items}</ul></div>`;
}

function renderScoresTable(context: ReportScanContext, includeDeltas: boolean) {
  const { scan, previousScan: prev } = context;
  const rows = [
    ["Overall", scan.overallScore, prev?.overallScore],
    ["Performance", scan.performanceScore, prev?.performanceScore],
    ["Accessibility", scan.accessibilityScore, prev?.accessibilityScore],
    ["SEO", scan.seoScore, prev?.seoScore],
    ["Security", scan.securityScore, prev?.securityScore],
  ] as const;

  const body = rows
    .map(([label, current, previous]) => {
      const delta = includeDeltas ? scoreDelta(current ?? null, previous ?? null) : null;
      const deltaHtml =
        delta !== null
          ? `<span class="${delta >= 0 ? "delta-pos" : "delta-neg"}">${delta >= 0 ? "+" : ""}${delta}</span>`
          : "—";
      return `<tr><td>${label}</td><td class="num">${formatScore(current ?? null)}</td>${includeDeltas ? `<td>${deltaHtml}</td>` : ""}</tr>`;
    })
    .join("");

  return `<table><thead><tr><th>Category</th><th>Score</th>${includeDeltas ? "<th>Change</th>" : ""}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderSingleScoreRow(label: string, score: number | null) {
  return `<table><thead><tr><th>Category</th><th>Score</th></tr></thead><tbody><tr><td>${label}</td><td class="num">${formatScore(score)} / 100</td></tr></tbody></table>`;
}

function renderVitalsTable(scan: ReportScanContext["scan"]) {
  return `<table><thead><tr><th>Metric</th><th>Value</th><th>Target (good)</th></tr></thead><tbody>
    <tr><td>LCP</td><td class="num">${scan.lcp ?? "—"} ms</td><td>≤ 2,500 ms</td></tr>
    <tr><td>INP</td><td class="num">${scan.inp ?? "—"} ms</td><td>≤ 200 ms</td></tr>
    <tr><td>CLS</td><td class="num">${scan.cls ?? "—"}</td><td>≤ 0.1</td></tr>
    <tr><td>FCP</td><td class="num">${scan.fcp ?? "—"} ms</td><td>≤ 1,800 ms</td></tr>
    <tr><td>TBT</td><td class="num">${scan.tbt ?? "—"} ms</td><td>≤ 200 ms</td></tr>
  </tbody></table>`;
}

function renderIssuesTable(issues: Issue[], startIndex = 0) {
  if (issues.length === 0) {
    return `<p style="color:#64748b;">No issues in this section.</p>`;
  }

  const rows = issues
    .map((issue, i) => {
      const idx = startIndex + i + 1;
      const sevClass = `sev-${issue.severity.toLowerCase()}`;
      return `<tr>
        <td class="col-num num">${idx}</td>
        <td class="col-sev"><span class="sev ${sevClass}">${issue.severity}</span></td>
        <td class="col-finding"><strong>${escapeHtml(issue.title)}</strong><br/><span style="color:#64748b;font-size:8.5pt;">${escapeHtml(issue.description)}</span></td>
        <td class="col-loc mono">${formatIssueLocationHtml(issue)}</td>
        <td class="action">${escapeHtml(formatActionableFix(issue))}</td>
      </tr>`;
    })
    .join("");

  return `<table><thead><tr>
    <th class="col-num">#</th>
    <th class="col-sev">Sev</th>
    <th class="col-finding">Finding</th>
    <th class="col-loc">Location</th>
    <th>Action required</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

function renderCategoryReport(context: ReportScanContext, category: IssueCategory, title: string) {
  const { website, scan } = context;
  const scanDate = formatScanDate(scan.completedAt);
  const categoryIssues = sortIssues(scan.issues.filter((i) => i.category === category));
  const score = categoryScore(scan, category);

  let body = `<div class="page">`;
  body += renderPageHeader(website.name, website.url, scanDate, `${categoryLabel(category)} report`);
  body += `<h1>${escapeHtml(title)}</h1>`;
  body += renderHeadlineBlock(scan.issues, category);
  body += `<h2>Score</h2>${renderSingleScoreRow(categoryLabel(category), score ?? null)}`;
  if (category === "PERFORMANCE") {
    body += `<h2>Core Web Vitals (lab)</h2>${renderVitalsTable(scan)}`;
  }
  body += `<h2>All ${categoryLabel(category).toLowerCase()} findings (${categoryIssues.length})</h2>`;
  body += renderIssuesTable(categoryIssues);
  body += renderFooter(`${LOOPNODE_BRAND} · loopnode.app`, categoryLabel(category));
  body += `</div>`;

  return wrapDocument(`${title} — ${website.name}`, body);
}

export function renderFullAuditHtml(context: ReportScanContext) {
  const { website, scan } = context;
  const scanDate = formatScanDate(scan.completedAt);
  const sorted = sortIssues(scan.issues);
  const grouped = groupIssuesByCategory(sorted);
  let issueIndex = 0;

  let body = `<div class="page">`;
  body += renderPageHeader(website.name, website.url, scanDate);
  body += `<h1>Full audit report</h1>`;
  body += renderHeadlineBlock(scan.issues);
  body += `<h2>Scores</h2>${renderScoresTable(context, false)}`;
  body += `<h2>Core Web Vitals (lab)</h2>${renderVitalsTable(scan)}`;
  body += `<h2>All findings (${sorted.length})</h2>`;
  body += renderIssuesTable(sorted);
  body += renderFooter(`${LOOPNODE_BRAND} · loopnode.app`, website.name);
  body += `</div>`;

  for (const [category, issues] of Object.entries(grouped)) {
    body += `<div class="page">`;
    body += renderPageHeader(website.name, website.url, scanDate, categoryLabel(category as Issue["category"]));
    body += `<h1>${escapeHtml(categoryLabel(category as Issue["category"]))}</h1>`;
    body += renderHeadlineBlock(scan.issues, category as IssueCategory);
    body += renderIssuesTable(issues, issueIndex);
    issueIndex += issues.length;
    body += renderFooter(LOOPNODE_BRAND, categoryLabel(category as Issue["category"]));
    body += `</div>`;
  }

  return wrapDocument(`Audit — ${website.name}`, body);
}

export function renderExecutiveSummaryHtml(context: ReportScanContext) {
  const { website, scan } = context;
  const scanDate = formatScanDate(scan.completedAt);
  const topIssues = getTopIssues(scan.issues, 15);
  const criticalCount = scan.issues.filter((i) => i.severity === "CRITICAL").length;

  let body = `<div class="page">`;
  body += renderPageHeader(website.name, website.url, scanDate, "Executive summary");
  body += `<h1>Executive summary</h1>`;
  body += renderHeadlineBlock(scan.issues);
  body += `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>
    <tr><td>Overall score</td><td class="num">${formatScore(scan.overallScore)} / 100</td></tr>
    <tr><td>Critical issues</td><td class="num">${criticalCount}</td></tr>
    <tr><td>Total issues</td><td class="num">${scan.issues.length}</td></tr>
  </tbody></table>`;
  body += `<h2>Category scores</h2>${renderScoresTable(context, true)}`;
  body += `<h2>Priority fixes (${topIssues.length})</h2>`;
  body += renderIssuesTable(topIssues);
  body += renderFooter(`${LOOPNODE_BRAND} · loopnode.app`, "Executive summary");
  body += `</div>`;

  return wrapDocument(`Summary — ${website.name}`, body);
}

export function renderPerformanceReportHtml(context: ReportScanContext) {
  return renderCategoryReport(context, "PERFORMANCE", "Performance report");
}

export function renderSeoReportHtml(context: ReportScanContext) {
  return renderCategoryReport(context, "SEO", "SEO report");
}

export function renderSecurityReportHtml(context: ReportScanContext) {
  return renderCategoryReport(context, "SECURITY", "Security report");
}

export function renderAccessibilityReportHtml(context: ReportScanContext) {
  return renderCategoryReport(context, "ACCESSIBILITY", "Accessibility report");
}
