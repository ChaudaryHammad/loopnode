import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send-email";
import {
  renderUpgradeApprovedEmail,
  renderUpgradeRejectedEmail,
  renderUpgradeSubmittedEmail,
  renderLimitsIncreasedEmail,
  renderAccountUpdatedEmail,
} from "@/lib/email/templates/upgrade-emails";
import type { NotificationType, PlanTier } from "@prisma/client";
import { PLAN_LABELS } from "@/lib/plans";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
}

export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
    },
  });

  if (input.sendEmail) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true },
    });
    if (user?.email) {
      let emailContent: { subject: string; html: string } | null = null;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      switch (input.type) {
        case "UPGRADE_SUBMITTED":
          emailContent = renderUpgradeSubmittedEmail({
            name: user.name ?? "",
            billingUrl: `${appUrl}/dashboard/settings/billing`,
          });
          break;
        case "UPGRADE_APPROVED":
          emailContent = renderUpgradeApprovedEmail({
            name: user.name ?? "",
            planLabel: String(input.metadata?.planLabel ?? "your new plan"),
            billingUrl: `${appUrl}/dashboard/settings/billing`,
          });
          break;
        case "UPGRADE_REJECTED":
          emailContent = renderUpgradeRejectedEmail({
            name: user.name ?? "",
            reason: String(input.metadata?.adminNote ?? input.body),
            billingUrl: `${appUrl}/dashboard/settings/billing`,
          });
          break;
        case "LIMITS_INCREASED":
          emailContent = renderLimitsIncreasedEmail({
            name: user.name ?? "",
            websiteLimit: Number(input.metadata?.websiteLimit ?? 0),
            billingUrl: `${appUrl}/dashboard/settings/billing`,
          });
          break;
        case "GENERAL":
          if (input.metadata?.accountUpdate) {
            emailContent = renderAccountUpdatedEmail({
              name: user.name ?? "",
              planLabel: String(input.metadata?.planLabel ?? "your plan"),
              websiteLimit: Number(input.metadata?.websiteLimit ?? 0),
              message: input.metadata?.adminNote ? String(input.metadata.adminNote) : null,
              billingUrl: `${appUrl}/dashboard/settings/billing`,
            });
          }
          break;
        default:
          break;
      }

      if (emailContent) {
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }).catch((err) => console.error("Notification email failed:", err));
      }
    }
  }

  return notification;
}

export async function notifyUpgradeSubmitted(userId: string, plan: PlanTier) {
  const planLabel = PLAN_LABELS[plan];
  return createNotification({
    userId,
    type: "UPGRADE_SUBMITTED",
    title: "Upgrade request received",
    body: `We're reviewing your request to upgrade to ${planLabel}. You'll be notified once it's processed.`,
    href: "/dashboard/settings/billing",
    metadata: { plan },
    sendEmail: true,
  });
}

export async function notifyUpgradeApproved(
  userId: string,
  plan: PlanTier,
  adminNote?: string | null
) {
  const planLabel = PLAN_LABELS[plan];
  return createNotification({
    userId,
    type: "UPGRADE_APPROVED",
    title: "Upgrade approved",
    body: adminNote
      ? `Your account is now on ${planLabel}. ${adminNote}`
      : `Your account has been upgraded to ${planLabel}. Enjoy your new limits!`,
    href: "/dashboard/settings/billing",
    metadata: { plan, planLabel, adminNote },
    sendEmail: true,
  });
}

export async function notifyUpgradeRejected(
  userId: string,
  adminNote?: string | null
) {
  return createNotification({
    userId,
    type: "UPGRADE_REJECTED",
    title: "Upgrade request declined",
    body:
      adminNote ??
      "We could not verify your payment. Please contact support or submit a new request with the correct reference.",
    href: "/dashboard/settings/billing/upgrade",
    metadata: { adminNote },
    sendEmail: true,
  });
}

export async function notifyLimitsIncreased(userId: string, websiteLimit: number) {
  return createNotification({
    userId,
    type: "LIMITS_INCREASED",
    title: "Website limit updated",
    body: `Your account can now connect up to ${websiteLimit} websites.`,
    href: "/dashboard/settings/billing",
    metadata: { websiteLimit },
    sendEmail: true,
  });
}

export async function notifySubscriptionUpdated(
  userId: string,
  params: {
    planLabel: string;
    websiteLimit: number;
    status: string;
    adminNote?: string | null;
    previousPlan?: PlanTier | null;
    previousLimit?: number | null;
  }
) {
  const body = params.adminNote?.trim()
    ? params.adminNote.trim()
    : `Your account is now on ${params.planLabel}. You can connect up to ${params.websiteLimit} websites.`;

  return createNotification({
    userId,
    type: "GENERAL",
    title: "Account updated",
    body,
    href: "/dashboard/settings/billing",
    metadata: {
      accountUpdate: true,
      planLabel: params.planLabel,
      websiteLimit: params.websiteLimit,
      status: params.status,
      adminNote: params.adminNote,
      previousPlan: params.previousPlan,
      previousLimit: params.previousLimit,
    },
    sendEmail: true,
  });
}

export async function notifyAdminsNewUpgradeRequest(params: {
  userEmail: string;
  plan: PlanTier;
  paymentReference: string;
  paymentProofUrl?: string | null;
}) {
  const supportEmail = process.env.SUPPORT_EMAIL ?? process.env.EMAIL_FROM;
  if (!supportEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const proofLine = params.paymentProofUrl
    ? `<p><a href="${params.paymentProofUrl}">View payment screenshot</a></p>`
    : "";

  await sendEmail({
    to: supportEmail,
    subject: `New upgrade request — ${PLAN_LABELS[params.plan]}`,
    html: `<p>New manual upgrade request from <strong>${params.userEmail}</strong>.</p>
      <p>Plan: ${PLAN_LABELS[params.plan]}<br/>Reference: ${params.paymentReference}</p>
      ${proofLine}
      <p><a href="${appUrl}/admin/upgrade-requests">Review in admin</a></p>`,
  }).catch((err) => console.error("Admin upgrade alert email failed:", err));
}
