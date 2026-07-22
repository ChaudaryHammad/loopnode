/**
 * Health Mesh email design system
 * Matches marketing site tokens: ink buttons, paper surfaces, Cadence mark.
 * Tables are used only where required for email-client compatibility.
 */

import { getAppUrl } from "@/lib/email/config";

export const emailBrand = {
  bg: "#f2f3f5",
  surface: "#ffffff",
  ink: "#0a0c10",
  inkSoft: "#1a1f29",
  muted: "#5c6570",
  faint: "#8b939e",
  line: "#e4e6ea",
  lineStrong: "#d5d8de",
  signal: "#0d7a6f",
  signalSoft: "#dff3f0",
  signalInk: "#085a52",
  alert: "#b42318",
  alertSoft: "#fceceb",
  warn: "#b54708",
  warnSoft: "#fef0c7",
  ok: "#0d7a6f",
  okSoft: "#dff3f0",
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
} as const;

interface LayoutOptions {
  preheader?: string;
  title: string;
  body: string;
  footerNote?: string;
  eyebrow?: string;
}

function cadenceMark(color = emailBrand.ink): string {
  const bar = (w: number, opacity = 1) =>
    `<td style="width:${w}px;height:18px;background:${color};opacity:${opacity};font-size:0;line-height:0;">&nbsp;</td>`;
  const gap = `<td style="width:3px;font-size:0;line-height:0;">&nbsp;</td>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
  <tr>
    ${bar(4)}${gap}${bar(4)}${gap}${bar(4)}${gap}${bar(4)}${gap}${bar(2, 0.35)}
  </tr>
</table>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailStrong(text: string): string {
  return `<strong style="color:${emailBrand.ink};font-weight:600;">${text}</strong>`;
}

export function renderEmailLayout({
  preheader,
  title,
  body,
  footerNote,
  eyebrow,
}: LayoutOptions): string {
  const year = new Date().getFullYear();
  const appUrl = getAppUrl();
  const footer =
    footerNote ??
    "You received this email because of activity on your Health Mesh account.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .hm-card { width: 100% !important; }
      .hm-pad { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${emailBrand.bg};font-family:${emailBrand.font};-webkit-font-smoothing:antialiased;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${emailBrand.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" class="hm-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Logo -->
          <tr>
            <td align="left" style="padding:0 4px 28px;">
              <a href="${escapeHtml(appUrl)}" style="text-decoration:none;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:10px;">${cadenceMark()}</td>
                    <td style="vertical-align:middle;">
                      <span style="font-size:16px;font-weight:650;color:${emailBrand.ink};letter-spacing:-0.03em;">Health <span style="font-weight:500;opacity:0.55;">Mesh</span></span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${emailBrand.surface};border:1px solid ${emailBrand.line};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="hm-pad" style="padding:36px 36px 8px;">
                    ${
                      eyebrow
                        ? `<p style="margin:0 0 12px;font-family:${emailBrand.mono};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${emailBrand.signal};">${escapeHtml(eyebrow)}</p>`
                        : ""
                    }
                    <h1 style="margin:0;font-size:24px;font-weight:650;color:${emailBrand.ink};line-height:1.25;letter-spacing:-0.03em;">${escapeHtml(title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td class="hm-pad" style="padding:20px 36px 36px;">
                    ${body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 8px 0;text-align:left;">
              <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${emailBrand.faint};">${footer}</p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:${emailBrand.faint};">© ${year} Health Mesh</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Primary CTA — ink black, matches marketing homepage buttons */
export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr>
    <td style="background-color:${emailBrand.ink};">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

/** Secondary outline CTA */
export function emailButtonSecondary(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 8px;">
  <tr>
    <td style="border:1px solid ${emailBrand.lineStrong};background-color:${emailBrand.surface};">
      <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:550;color:${emailBrand.ink};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${emailBrand.muted};">${text}</p>`;
}

export function emailGreeting(name?: string | null): string {
  const label = name?.trim() ? `Hi ${escapeHtml(name.trim())},` : "Hi there,";
  return emailParagraph(label);
}

export function emailMuted(text: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:${emailBrand.faint};">${text}</p>`;
}

export function emailDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="border-top:1px solid ${emailBrand.line};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
</table>`;
}

export function emailCodeBlock(text: string): string {
  return `<p style="margin:20px 0 0;padding:12px 14px;background-color:${emailBrand.bg};border:1px solid ${emailBrand.line};font-size:12px;line-height:1.5;color:${emailBrand.muted};word-break:break-all;font-family:${emailBrand.mono};">${escapeHtml(text)}</p>`;
}

export function emailInfoBox(
  title: string,
  rows: Array<{ label: string; value: string }>
): string {
  const rowsHtml = rows
    .map(
      (row, i) => `<tr>
        <td style="padding:${i === 0 ? "0" : "10px"} 0 ${i === rows.length - 1 ? "0" : "10px"};font-size:12px;font-family:${emailBrand.mono};letter-spacing:0.04em;text-transform:uppercase;color:${emailBrand.faint};vertical-align:top;width:112px;">${escapeHtml(row.label)}</td>
        <td style="padding:${i === 0 ? "0" : "10px"} 0 ${i === rows.length - 1 ? "0" : "10px"};font-size:14px;color:${emailBrand.inkSoft};word-break:break-word;line-height:1.45;">${escapeHtml(row.value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:${emailBrand.bg};border:1px solid ${emailBrand.line};">
  <tr><td style="padding:18px 20px;">
    <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:${emailBrand.ink};letter-spacing:-0.01em;">${escapeHtml(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
  </td></tr>
</table>`;
}

type AlertTone = "info" | "success" | "warning" | "danger";

const alertStyles: Record<AlertTone, { bg: string; fg: string; label: string }> = {
  info: { bg: emailBrand.bg, fg: emailBrand.inkSoft, label: "Note" },
  success: { bg: emailBrand.okSoft, fg: emailBrand.signalInk, label: "Resolved" },
  warning: { bg: emailBrand.warnSoft, fg: emailBrand.warn, label: "Attention" },
  danger: { bg: emailBrand.alertSoft, fg: emailBrand.alert, label: "Alert" },
};

export function emailAlert(tone: AlertTone, message: string, label?: string): string {
  const style = alertStyles[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:${style.bg};">
  <tr><td style="padding:14px 16px;">
    <p style="margin:0 0 4px;font-family:${emailBrand.mono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${style.fg};">${escapeHtml(label ?? style.label)}</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:${style.fg};">${message}</p>
  </td></tr>
</table>`;
}

export function emailHelp(text = "Need help? Reply to this email or contact support from your dashboard."): string {
  return `${emailDivider()}<p style="margin:0;font-size:13px;line-height:1.55;color:${emailBrand.faint};">${text}</p>`;
}
