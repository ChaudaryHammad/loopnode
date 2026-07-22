import {
  emailAlert,
  emailButton,
  emailGreeting,
  emailInfoBox,
  emailMuted,
  emailParagraph,
  emailStrong,
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
    ${emailGreeting(params.name)}
    ${emailAlert(
      "danger",
      `${escapeHtml(params.websiteName)} looks unreachable.`,
      "Downtime"
    )}
    ${emailInfoBox("Incident", [
      { label: "URL", value: params.url },
      { label: "Status", value: params.httpStatus },
      { label: "Error", value: params.error },
      { label: "Detected", value: params.checkedAt },
    ])}
    ${emailButton(params.dashboardUrl, "Open monitor")}
    ${emailMuted("We’ll email you again when the site recovers, if recovery alerts are enabled.")}
  `;
  return {
    subject: `[Down] ${params.websiteName}`,
    html: renderEmailLayout({
      preheader: `${params.websiteName} appears to be down`,
      eyebrow: "Monitoring",
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
    ${emailGreeting(params.name)}
    ${emailAlert(
      "success",
      `${escapeHtml(params.websiteName)} is responding again.`,
      "Recovered"
    )}
    ${emailInfoBox("Recovery", [
      { label: "URL", value: params.url },
      { label: "Downtime", value: params.downtime },
      { label: "Latency", value: params.latencyMs },
    ])}
    ${emailButton(params.dashboardUrl, "View monitor")}
  `;
  return {
    subject: `[Recovered] ${params.websiteName}`,
    html: renderEmailLayout({
      preheader: `${params.websiteName} is back up`,
      eyebrow: "Monitoring",
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
  const days =
    params.daysRemaining === 1 ? "1 day" : `${params.daysRemaining} days`;
  const body = `
    ${emailGreeting(params.name)}
    ${emailAlert(
      "warning",
      `SSL for ${emailStrong(escapeHtml(params.websiteName))} expires in ${emailStrong(days)}.`,
      "SSL"
    )}
    ${emailInfoBox("Certificate", [
      { label: "URL", value: params.url },
      { label: "Expires", value: params.expiresAt },
      { label: "Remaining", value: days },
    ])}
    ${emailButton(params.dashboardUrl, "Open monitor")}
    ${emailMuted("Renew before expiry to avoid browser warnings and traffic loss.")}
  `;
  return {
    subject: `[SSL] ${params.websiteName} expires in ${params.daysRemaining}d`,
    html: renderEmailLayout({
      preheader: `SSL expires in ${params.daysRemaining} days`,
      eyebrow: "Security",
      title: "Certificate expiring",
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
    ${emailGreeting(params.name)}
    ${emailAlert(
      "warning",
      `${escapeHtml(params.websiteName)} responded slower than your threshold.`,
      "Performance"
    )}
    ${emailInfoBox("Response", [
      { label: "URL", value: params.url },
      { label: "Latency", value: `${params.latencyMs} ms` },
      { label: "Threshold", value: `${params.thresholdMs} ms` },
    ])}
    ${emailButton(params.dashboardUrl, "Open monitor")}
  `;
  return {
    subject: `[Slow] ${params.websiteName} · ${params.latencyMs}ms`,
    html: renderEmailLayout({
      preheader: `Slow response: ${params.latencyMs}ms`,
      eyebrow: "Performance",
      title: "Slow response",
      body,
    }),
  };
}
