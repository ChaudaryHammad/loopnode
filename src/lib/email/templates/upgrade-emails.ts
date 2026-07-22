import {
  renderEmailLayout,
  emailButton,
  emailParagraph,
  emailMuted,
  emailGreeting,
  emailStrong,
  emailAlert,
  emailHelp,
  escapeHtml,
} from "./layout";

export function renderUpgradeSubmittedEmail(params: {
  name: string;
  billingUrl: string;
}) {
  const body = `
    ${emailGreeting(params.name)}
    ${emailParagraph("We’ve received your upgrade request and will verify payment shortly.")}
    ${emailParagraph("You’ll get another email when it’s approved — or if we need anything else.")}
    ${emailButton(params.billingUrl, "View billing")}
    ${emailMuted("Typical review time: 1–2 business days.")}
  `;
  return {
    subject: "Upgrade request received",
    html: renderEmailLayout({
      preheader: "We’re reviewing your plan upgrade",
      eyebrow: "Billing",
      title: "Request received",
      body,
    }),
  };
}

export function renderUpgradeApprovedEmail(params: {
  name: string;
  planLabel: string;
  billingUrl: string;
}) {
  const body = `
    ${emailGreeting(params.name)}
    ${emailAlert(
      "success",
      `Your ${escapeHtml(params.planLabel)} plan is active. New limits and features are available now.`,
      "Approved"
    )}
    ${emailButton(params.billingUrl, "Go to billing")}
  `;
  return {
    subject: `${params.planLabel} is active`,
    html: renderEmailLayout({
      preheader: "Your Health Mesh upgrade is live",
      eyebrow: "Billing",
      title: "Upgrade approved",
      body,
    }),
  };
}

export function renderUpgradeRejectedEmail(params: {
  name: string;
  reason: string;
  billingUrl: string;
}) {
  const body = `
    ${emailGreeting(params.name)}
    ${emailAlert("warning", escapeHtml(params.reason), "Couldn’t approve")}
    ${emailParagraph("You can submit a new request with the correct payment reference, or contact support.")}
    ${emailButton(params.billingUrl, "Open billing")}
    ${emailHelp()}
  `;
  return {
    subject: "Update on your upgrade request",
    html: renderEmailLayout({
      preheader: "Your upgrade request needs attention",
      eyebrow: "Billing",
      title: "Upgrade not approved",
      body,
    }),
  };
}

export function renderLimitsIncreasedEmail(params: {
  name: string;
  websiteLimit: number;
  billingUrl: string;
}) {
  const body = `
    ${emailGreeting(params.name)}
    ${emailParagraph(
      `Your website limit is now ${emailStrong(String(params.websiteLimit))}. You can connect additional sites anytime.`
    )}
    ${emailButton(params.billingUrl, "View account")}
  `;
  return {
    subject: "Website limit updated",
    html: renderEmailLayout({
      preheader: "Your account limits were increased",
      eyebrow: "Account",
      title: "Limits increased",
      body,
    }),
  };
}

export function renderAccountUpdatedEmail(params: {
  name: string;
  planLabel: string;
  websiteLimit: number;
  message?: string | null;
  billingUrl: string;
}) {
  const detail = params.message
    ? emailParagraph(escapeHtml(params.message))
    : emailParagraph(
        `Your account is now on ${emailStrong(escapeHtml(params.planLabel))} with a limit of ${emailStrong(String(params.websiteLimit))} websites.`
      );

  const body = `
    ${emailGreeting(params.name)}
    ${detail}
    ${emailButton(params.billingUrl, "View account")}
  `;
  return {
    subject: "Account updated",
    html: renderEmailLayout({
      preheader: "Your Health Mesh account settings changed",
      eyebrow: "Account",
      title: "Account updated",
      body,
    }),
  };
}
