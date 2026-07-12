import {
  emailButton,
  emailInfoBox,
  emailMuted,
  emailParagraph,
  escapeHtml,
  renderEmailLayout,
} from "@/lib/email/templates/layout";

export function renderUptimeDownEmail(params: {
  name: string;
  websiteName: string;
  url: string;
  error: string;
  httpStatus: string;
  checkedAt: string;
  dashboardUrl: string;
}) {
  const body = `
    ${emailParagraph(`Hi ${escapeHtml(params.name || "there")},`)}
    ${emailParagraph(
      `Your monitor for <strong style="color:#f9fafb;">${escapeHtml(params.websiteName)}</strong> detected an outage.`
    )}
    ${emailInfoBox("Incident details", [
      { label: "URL", value: params.url },
      { label: "Status", value: params.httpStatus },
      { label: "Error", value: params.error },
      { label: "Detected", value: params.checkedAt },
    ])}
    ${emailButton(params.dashboardUrl, "Open monitor")}
    ${emailMuted("You'll receive another email when the site recovers (if recovery alerts are enabled).")}
  `;
  return {
    subject: `[Down] ${params.websiteName} is unreachable`,
    html: renderEmailLayout({
      preheader: `${params.websiteName} appears to be down`,
      title: "Website down",
      body,
    }),
  };
}

export function renderUptimeRecoveredEmail(params: {
  name: string;
  websiteName: string;
  url: string;
  downtime: string;
  latencyMs: string;
  dashboardUrl: string;
}) {
  const body = `
    ${emailParagraph(`Hi ${escapeHtml(params.name || "there")},`)}
    ${emailParagraph(
      `<strong style="color:#f9fafb;">${escapeHtml(params.websiteName)}</strong> is back up.`
    )}
    ${emailInfoBox("Recovery details", [
      { label: "URL", value: params.url },
      { label: "Downtime", value: params.downtime },
      { label: "Latency", value: params.latencyMs },
    ])}
    ${emailButton(params.dashboardUrl, "View monitor")}
  `;
  return {
    subject: `[Recovered] ${params.websiteName} is back up`,
    html: renderEmailLayout({
      preheader: `${params.websiteName} recovered`,
      title: "Website recovered",
      body,
    }),
  };
}

export function renderUptimeSslExpiringEmail(params: {
  name: string;
  websiteName: string;
  url: string;
  daysRemaining: number;
  expiresAt: string;
  dashboardUrl: string;
}) {
  const body = `
    ${emailParagraph(`Hi ${escapeHtml(params.name || "there")},`)}
    ${emailParagraph(
      `The SSL certificate for <strong style="color:#f9fafb;">${escapeHtml(params.websiteName)}</strong> expires in <strong style="color:#fbbf24;">${params.daysRemaining} day${params.daysRemaining === 1 ? "" : "s"}</strong>.`
    )}
    ${emailInfoBox("Certificate", [
      { label: "URL", value: params.url },
      { label: "Expires", value: params.expiresAt },
      { label: "Days left", value: String(params.daysRemaining) },
    ])}
    ${emailButton(params.dashboardUrl, "Open monitor")}
    ${emailMuted("Renew the certificate before it expires to avoid browser warnings and downtime.")}
  `;
  return {
    subject: `[SSL] ${params.websiteName} certificate expires in ${params.daysRemaining}d`,
    html: renderEmailLayout({
      preheader: `SSL expires in ${params.daysRemaining} days`,
      title: "SSL certificate expiring",
      body,
    }),
  };
}

export function renderUptimeSlowEmail(params: {
  name: string;
  websiteName: string;
  url: string;
  latencyMs: number;
  thresholdMs: number;
  dashboardUrl: string;
}) {
  const body = `
    ${emailParagraph(`Hi ${escapeHtml(params.name || "there")},`)}
    ${emailParagraph(
      `<strong style="color:#f9fafb;">${escapeHtml(params.websiteName)}</strong> responded slower than your threshold.`
    )}
    ${emailInfoBox("Performance", [
      { label: "URL", value: params.url },
      { label: "Latency", value: `${params.latencyMs} ms` },
      { label: "Threshold", value: `${params.thresholdMs} ms` },
    ])}
    ${emailButton(params.dashboardUrl, "Open monitor")}
  `;
  return {
    subject: `[Slow] ${params.websiteName} response ${params.latencyMs}ms`,
    html: renderEmailLayout({
      preheader: `Slow response: ${params.latencyMs}ms`,
      title: "Slow response alert",
      body,
    }),
  };
}
