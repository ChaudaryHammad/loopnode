import {
  renderEmailLayout,
  emailButton,
  emailParagraph,
  emailMuted,
  escapeHtml,
} from "./layout";

function greeting(name: string) {
  return name ? `Hi ${escapeHtml(name)},` : "Hi there,";
}

export function renderUpgradeSubmittedEmail(params: {
  name: string;
  billingUrl: string;
}) {
  const body = `
    ${emailParagraph(greeting(params.name))}
    ${emailParagraph("We've received your plan upgrade request. Our team will verify your payment and activate your new plan shortly.")}
    ${emailParagraph("You'll receive another notification once your request is approved or if we need more information.")}
    ${emailButton(params.billingUrl, "View billing")}
    ${emailMuted("Typical review time is 1–2 business days.")}
  `;
  return {
    subject: "We received your upgrade request",
    html: renderEmailLayout({
      preheader: "Your upgrade request is being reviewed",
      title: "Upgrade request received",
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
    ${emailParagraph(greeting(params.name))}
    ${emailParagraph(`Great news — your upgrade to <strong style="color:#f9fafb;">${escapeHtml(params.planLabel)}</strong> is active.`)}
    ${emailParagraph("Your new website limits and features are available now.")}
    ${emailButton(params.billingUrl, "Go to billing")}
  `;
  return {
    subject: `Your ${params.planLabel} upgrade is active`,
    html: renderEmailLayout({
      preheader: "Your plan upgrade was approved",
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
    ${emailParagraph(greeting(params.name))}
    ${emailParagraph("We couldn't approve your upgrade request at this time.")}
    ${emailParagraph(`<strong style="color:#f9fafb;">Reason:</strong> ${escapeHtml(params.reason)}`)}
    ${emailParagraph("You can submit a new request with the correct payment reference or contact support for help.")}
    ${emailButton(params.billingUrl, "Billing & support")}
  `;
  return {
    subject: "Update on your upgrade request",
    html: renderEmailLayout({
      preheader: "Your upgrade request needs attention",
      title: "Upgrade request declined",
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
    ${emailParagraph(greeting(params.name))}
    ${emailParagraph(`Your website limit has been increased. You can now connect up to <strong style="color:#f9fafb;">${params.websiteLimit}</strong> websites.`)}
    ${emailButton(params.billingUrl, "View billing")}
  `;
  return {
    subject: "Your website limit was updated",
    html: renderEmailLayout({
      preheader: "Your account limits were updated",
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
        `Your account is now on <strong style="color:#f9fafb;">${escapeHtml(params.planLabel)}</strong> with a limit of <strong style="color:#f9fafb;">${params.websiteLimit}</strong> websites.`
      );

  const body = `
    ${emailParagraph(greeting(params.name))}
    ${detail}
    ${emailButton(params.billingUrl, "View account")}
  `;
  return {
    subject: "Your account was updated",
    html: renderEmailLayout({
      preheader: "Your LoopNode account settings changed",
      title: "Account updated",
      body,
    }),
  };
}
