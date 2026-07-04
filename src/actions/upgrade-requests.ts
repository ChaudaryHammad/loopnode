"use server";

import { auth } from "@/lib/auth";
import { uploadPaymentProof, isOurCloudinaryUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import {
  notifyAdminsNewUpgradeRequest,
  notifyUpgradeSubmitted,
} from "@/lib/notification-service";
import { getPaymentMethodById } from "@/lib/payment-methods";
import { PLAN_PRICES_USD, PLAN_LABELS } from "@/lib/plans";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PlanTier } from "@prisma/client";

const PROOF_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

const upgradeRequestSchema = z.object({
  requestedPlan: z.enum(["PRO", "AGENCY"]),
  paymentMethodConfigId: z.string().min(1, "Select a payment method."),
  paymentReference: z
    .string()
    .min(4, "Enter your payment transaction ID or reference.")
    .max(120),
  paymentProofUrl: z.string().url().optional().nullable(),
  userNote: z.string().max(1000).optional(),
});

export async function getBillingOverviewAction() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const entitlements = await getEntitlements(session.user.id);

  const [requests, pendingRequest] = await Promise.all([
    prisma.upgradeRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.upgradeRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
    }),
  ]);

  return {
    success: true,
    data: {
      entitlements,
      requests,
      pendingRequest,
      planPrices: PLAN_PRICES_USD,
    },
  };
}

export async function uploadPaymentProofAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No image selected." };
  }

  if (!PROOF_IMAGE_TYPES.has(file.type)) {
    return { success: false, error: "Use a JPEG, PNG, or WebP screenshot." };
  }

  if (file.size > PROOF_MAX_BYTES) {
    return { success: false, error: "Image must be 5 MB or smaller." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadPaymentProof(session.user.id, buffer, file.type);
    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error("uploadPaymentProofAction:", error);
    return { success: false, error: "Failed to upload screenshot." };
  }
}

export async function submitUpgradeRequestAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const parsed = upgradeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const userId = session.user.id;
  const { requestedPlan, paymentMethodConfigId, paymentReference, paymentProofUrl, userNote } =
    parsed.data;

  if (paymentProofUrl && !isOurCloudinaryUrl(paymentProofUrl)) {
    return { success: false, error: "Invalid payment proof." };
  }

  const paymentMethod = await getPaymentMethodById(paymentMethodConfigId);
  if (!paymentMethod) {
    return { success: false, error: "Selected payment method is no longer available." };
  }

  const existingPending = await prisma.upgradeRequest.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (existingPending) {
    return {
      success: false,
      error: "You already have a pending upgrade request. We'll notify you when it's reviewed.",
    };
  }

  const entitlements = await getEntitlements(userId);
  if (entitlements.plan === requestedPlan && entitlements.status === "ACTIVE") {
    return { success: false, error: `You're already on the ${PLAN_LABELS[requestedPlan]} plan.` };
  }

  try {
    const request = await prisma.upgradeRequest.create({
      data: {
        userId,
        requestedPlan: requestedPlan as PlanTier,
        paymentMethod: "OTHER",
        paymentMethodConfigId: paymentMethod.id,
        paymentMethodLabel: paymentMethod.label,
        paymentReference: paymentReference.trim(),
        paymentProofUrl: paymentProofUrl ?? null,
        userNote: userNote?.trim() || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPGRADE_REQUEST_SUBMITTED",
        description: `Submitted upgrade request for ${PLAN_LABELS[requestedPlan]}`,
        metadata: {
          requestId: request.id,
          requestedPlan,
          paymentMethodLabel: paymentMethod.label,
          hasProof: Boolean(paymentProofUrl),
        },
      },
    });

    await notifyUpgradeSubmitted(userId, requestedPlan as PlanTier);
    await notifyAdminsNewUpgradeRequest({
      userEmail: session.user.email ?? "unknown",
      plan: requestedPlan as PlanTier,
      paymentReference: paymentReference.trim(),
      paymentProofUrl: paymentProofUrl ?? null,
    });

    revalidatePath("/dashboard/settings/billing");
    revalidatePath("/dashboard/settings/billing/upgrade");

    return { success: true, data: { requestId: request.id } };
  } catch (error) {
    console.error("submitUpgradeRequestAction:", error);
    return { success: false, error: "Failed to submit upgrade request." };
  }
}
