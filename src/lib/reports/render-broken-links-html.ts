import type { BrokenLinkFinding } from "@/lib/reports/generate-broken-links-pdf";
import { formatResourceTypes } from "@/lib/scanner/link-resource-types";
import {
  escapeHtml,
  LOOPNODE_BRAND,
  renderFooter,
  renderPageHeader,
  wrapDocument,
} from "@/lib/reports/report-html-shared";

export type BrokenLinksHtmlInput = {
  websiteName: string;
  websiteUrl: string;
  mode: string;
  resourceTypes: Parameters<typeof formatResourceTypes>[0];
  completedAt: string | null;
  pagesCrawled: number;
  linksChecked: number;
  brokenCount: number;
  findings: BrokenLinkFinding[];
};

function formatCompletedDate(completedAt: string | null) {
  const date = completedAt ? new Date(completedAt) : new Date();
  return date.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

function severityClass(severity: string) {
  return `sev-${severity.toLowerCase()}`;
}

function formatElement(finding: BrokenLinkFinding) {
  const parts = [
    finding.elementTag ? `<${finding.elementTag}>` : null,
    finding.attribute ? `[${finding.attribute}]` : null,
    finding.elementId ? `#${finding.elementId}` : null,
    finding.elementClass ? `.${finding.elementClass.split(/\s+/)[0]}` : null,
    finding.selector,
    finding.elementText ? `"${finding.elementText.slice(0, 60)}"` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "—";
}

function renderFindingsTable(findings: BrokenLinkFinding[]) {
  if (findings.length === 0) {
    return `<p style="color:#64748b;">No broken links found in this scan.</p>`;
  }

  const rows = findings
    .map((finding, i) => {
      const status =
        finding.statusCode !== null
          ? `HTTP ${finding.statusCode}`
          : (finding.errorMessage ?? "Unreachable");
      return `<tr>
        <td class="col-num num">${i + 1}</td>
        <td class="col-sev"><span class="sev ${severityClass(finding.severity)}">${finding.severity}</span></td>
        <td><strong>${escapeHtml(status)}</strong></td>
        <td class="mono">${escapeHtml(finding.href)}</td>
        <td class="mono">${escapeHtml(finding.sourcePageUrl)}</td>
        <td class="mono">${escapeHtml(formatElement(finding))}</td>
      </tr>`;
    })
    .join("");

  return `<table><thead><tr>
    <th class="col-num">#</th>
    <th class="col-sev">Sev</th>
    <th>Status</th>
    <th>Broken URL</th>
    <th>Found on page</th>
    <th>Element</th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

export function renderBrokenLinksHtml(input: BrokenLinksHtmlInput) {
  const scanDate = formatCompletedDate(input.completedAt);
  const modeLabel = input.mode === "EXTERNAL" ? "External links" : "Internal links";

  let body = `<div class="page">`;
  body += renderPageHeader(input.websiteName, input.websiteUrl, scanDate, "Broken links report");
  body += `<h1>Broken links report</h1>`;

  if (input.brokenCount > 0) {
    body += `<div class="headline-box"><div class="headline-title">Summary</div><ul class="headline-list"><li><strong>${input.brokenCount}</strong> broken link${input.brokenCount === 1 ? "" : "s"} across ${input.pagesCrawled} page${input.pagesCrawled === 1 ? "" : "s"}</li><li>${input.linksChecked} links checked · ${modeLabel}</li></ul></div>`;
  } else {
    body += `<div class="headline-box ok"><div class="headline-title">Summary</div><ul class="headline-list"><li>No broken links found</li></ul></div>`;
  }

  body += `<table><thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody>
    <tr><td>Scan mode</td><td>${escapeHtml(modeLabel)}</td></tr>
    <tr><td>Link types</td><td>${escapeHtml(formatResourceTypes(input.resourceTypes))}</td></tr>
    <tr><td>Pages crawled</td><td class="num">${input.pagesCrawled}</td></tr>
    <tr><td>Links checked</td><td class="num">${input.linksChecked}</td></tr>
    <tr><td>Broken links</td><td class="num">${input.brokenCount}</td></tr>
  </tbody></table>`;

  body += `<h2>Findings (${input.findings.length})</h2>`;
  body += renderFindingsTable(input.findings);
  body += renderFooter(`${LOOPNODE_BRAND} · loopnode.app`, input.websiteName);
  body += `</div>`;

  return wrapDocument(`Broken links — ${input.websiteName}`, body);
}
