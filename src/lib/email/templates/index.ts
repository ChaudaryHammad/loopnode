import {
  renderEmailLayout,
  emailButton,
  emailParagraph,
  emailMuted,
  emailCodeBlock,
  emailInfoBox,
  emailGreeting,
  emailStrong,
  emailAlert,
  emailHelp,
  emailDivider,
  escapeHtml,
} from "./layout";

export function renderVerifyEmailEmail(params: { name: string; verifyUrl: string }) {
  const body = `
    ${emailGreeting(params.name)}
    ${emailParagraph(
      `Confirm your email to activate your Health Mesh account and start monitoring.`
    )}
    ${emailButton(params.verifyUrl, "Verify email")}
    ${emailMuted("This link expires in 24 hours. If you didn’t create an account, you can ignore this email.")}
    ${emailDivider()}
    ${emailParagraph(`Or paste this link into your browser:`)}
    ${emailCodeBlock(params.verifyUrl)}
  `;

  return {
    subject: "Verify your email",
    html: renderEmailLayout({
      preheader: "Confirm your email to start using Health Mesh",
      eyebrow: "Account",
      title: "Verify your email",
      body,
    }),
  };
}

export function renderPasswordResetEmail(params: { resetUrl: string }) {
  const body = `
    ${emailGreeting()}
    ${emailParagraph("We received a request to reset your password.")}
    ${emailParagraph(`This link expires in ${emailStrong("1 hour")}.`)}
    ${emailButton(params.resetUrl, "Reset password")}
    ${emailMuted("If you didn’t request this, you can ignore this email. Your password won’t change.")}
    ${emailDivider()}
    ${emailParagraph(`Or paste this link into your browser:`)}
    ${emailCodeBlock(params.resetUrl)}
  `;

  return {
    subject: "Reset your password",
    html: renderEmailLayout({
      preheader: "Choose a new password for your Health Mesh account",
      eyebrow: "Security",
      title: "Reset your password",
      body,
    }),
  };
}

export function renderPasswordResetSuccessEmail(params: { loginUrl: string }) {
  const body = `
    ${emailGreeting()}
    ${emailAlert("success", "Your password was updated successfully.", "Confirmed")}
    ${emailParagraph("You can sign in with your new password now.")}
    ${emailButton(params.loginUrl, "Sign in")}
    ${emailAlert(
      "danger",
      "If you didn’t make this change, secure your account immediately and contact support.",
      "Didn’t do this?"
    )}
  `;

  return {
    subject: "Your password was changed",
    html: renderEmailLayout({
      preheader: "Your Health Mesh password was updated",
      eyebrow: "Security",
      title: "Password updated",
      body,
      footerNote: "Security notification from Health Mesh.",
    }),
  };
}

export function renderContactSupportEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const body = `
    ${emailParagraph("A new message arrived from the contact form.")}
    ${emailInfoBox("Details", [
      { label: "Name", value: params.name },
      { label: "Email", value: params.email },
      { label: "Subject", value: params.subject },
      { label: "Message", value: params.message },
    ])}
    ${emailMuted(
      `Reply to <a href="mailto:${escapeHtml(params.email)}" style="color:${escapeHtml("#0a0c10")};text-decoration:underline;">${escapeHtml(params.email)}</a>`
    )}
  `;

  return {
    subject: `[Contact] ${params.subject}`,
    html: renderEmailLayout({
      preheader: `New contact: ${params.subject}`,
      eyebrow: "Inbox",
      title: "New contact message",
      body,
      footerNote: "Internal Health Mesh notification.",
    }),
  };
}

export function renderContactConfirmationEmail(params: { name: string }) {
  const body = `
    ${emailGreeting(params.name)}
    ${emailParagraph("Thanks for writing. We’ve received your message and will reply within 1–2 business days.")}
    ${emailMuted("This is an automated confirmation — no need to reply.")}
    ${emailHelp("In the meantime, you can explore Health Mesh features from the website.")}
  `;

  return {
    subject: "We received your message",
    html: renderEmailLayout({
      preheader: "Thanks for contacting Health Mesh",
      eyebrow: "Support",
      title: "Message received",
      body,
    }),
  };
}

export function renderNewsletterWelcomeEmail(params: {
  unsubscribeUrl: string;
}) {
  const body = `
    ${emailGreeting()}
    ${emailParagraph(
      `You’re subscribed to Health Mesh updates — product news, reliability insights, and practical guidance.`
    )}
    ${emailParagraph("We’ll keep it useful and infrequent.")}
    ${emailMuted(
      `<a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#8b939e;text-decoration:underline;">Unsubscribe</a> anytime.`
    )}
  `;

  return {
    subject: "You’re subscribed to Health Mesh",
    html: renderEmailLayout({
      preheader: "Welcome to Health Mesh updates",
      eyebrow: "Newsletter",
      title: "You’re in",
      body,
      footerNote: "Health Mesh newsletter. Unsubscribe anytime with the link above.",
    }),
  };
}

export function renderNewsletterUnsubscribeEmail() {
  const body = `
    ${emailGreeting()}
    ${emailParagraph("You’ve been unsubscribed. You won’t receive further newsletter emails from us.")}
    ${emailMuted("Changed your mind? You can resubscribe from the website footer.")}
  `;

  return {
    subject: "You’ve been unsubscribed",
    html: renderEmailLayout({
      preheader: "Newsletter subscription ended",
      eyebrow: "Newsletter",
      title: "Unsubscribed",
      body,
      footerNote: "Health Mesh newsletter confirmation.",
    }),
  };
}
