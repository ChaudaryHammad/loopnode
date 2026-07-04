export const LOOPNODE_BRAND = "LoopNode";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatScanDate(date: Date | null | undefined) {
  if (!date) return "Unknown date";
  return date.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

export function reportStyles() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a; font-size: 10pt; line-height: 1.45;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .page { padding: 44px 48px; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .header {
      display: flex; justify-content: space-between; align-items: flex-end;
      border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 28px;
    }
    .logo { font-size: 20pt; font-weight: 800; letter-spacing: -0.03em; color: #0f172a; }
    .logo-sub { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.14em; margin-top: 2px; }
    .meta { text-align: right; font-size: 9pt; color: #64748b; line-height: 1.5; }
    h1 { font-size: 22pt; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    h2 {
      font-size: 12pt; font-weight: 700; color: #0f172a;
      margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;
    }
    .subtitle { color: #64748b; font-size: 10pt; margin-bottom: 20px; max-width: 640px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 10px 0 18px; font-size: 9pt; }
    th {
      text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.08em;
      color: #64748b; padding: 8px 8px; border-bottom: 2px solid #cbd5e1; background: #f8fafc;
    }
    td {
      padding: 9px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top;
      word-wrap: break-word; overflow-wrap: anywhere; white-space: normal;
    }
    .col-num { width: 28px; }
    .col-sev { width: 62px; }
    .col-finding { width: 28%; }
    .col-loc { width: 22%; }
    .sev { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .sev-critical { color: #b91c1c; }
    .sev-major { color: #b45309; }
    .sev-minor { color: #1d4ed8; }
    .sev-info { color: #64748b; }
    .mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 8.5pt; color: #475569; }
    .action { color: #166534; }
    .num { font-variant-numeric: tabular-nums; font-weight: 600; }
    .delta-pos { color: #059669; font-size: 8.5pt; }
    .delta-neg { color: #dc2626; font-size: 8.5pt; }
    .footer {
      margin-top: 32px; padding-top: 10px; border-top: 1px solid #e2e8f0;
      font-size: 7.5pt; color: #94a3b8; display: flex; justify-content: space-between;
    }
    .headline-box {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;
      padding: 14px 16px; margin-bottom: 20px;
    }
    .headline-box.ok { background: #f0fdf4; border-color: #bbf7d0; }
    .headline-title { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #991b1b; margin-bottom: 8px; }
    .headline-box.ok .headline-title { color: #166534; }
    .headline-list { list-style: none; }
    .headline-list li {
      font-size: 9.5pt; padding: 4px 0; color: #7f1d1d;
      word-wrap: break-word; overflow-wrap: anywhere; white-space: normal; line-height: 1.45;
    }
    .headline-box.ok .headline-list li { color: #14532d; }
    .headline-list li::before { content: "• "; font-weight: 700; }
    tr { page-break-inside: avoid; }
  `;
}

export function renderPageHeader(
  websiteName: string,
  websiteUrl: string,
  scanDate: string,
  subtitle = "Website audit report"
) {
  return `
    <div class="header">
      <div>
        <div class="logo">${LOOPNODE_BRAND}</div>
        <div class="logo-sub">${escapeHtml(subtitle)}</div>
      </div>
      <div class="meta">
        <strong>${escapeHtml(websiteName)}</strong><br/>
        ${escapeHtml(websiteUrl)}<br/>
        ${escapeHtml(scanDate)}
      </div>
    </div>`;
}

export function wrapDocument(title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title><style>${reportStyles()}</style></head><body>${body}</body></html>`;
}

export function renderFooter(left: string, right: string) {
  return `<div class="footer"><span>${escapeHtml(left)}</span><span>${escapeHtml(right)}</span></div>`;
}
