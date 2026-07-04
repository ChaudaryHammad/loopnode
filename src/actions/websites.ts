"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import { assertCanAddWebsite, consumeDomainSlot, getDomainDeleteNotice, getDomainSlotForHost, releaseDomainSlot } from "@/lib/website-slots";
import { ScanFrequency } from "@prisma/client";
import { computeNextScanAt } from "@/lib/scan-schedule";
import { websiteSchema } from "@/lib/validations/website";
import { revalidatePath } from "next/cache";

export async function addWebsiteAction(values: unknown) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const parsed = websiteSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, url, scanFrequency, scanTimezone, scanTimeOfDay, scanDayOfWeek, scanDayOfMonth } =
    parsed.data;
  const userId = session.user.id;

  try {
    const entitlements = await getEntitlements(userId);
    if (
      scanFrequency !== ScanFrequency.MANUAL &&
      !entitlements.canScheduleScans
    ) {
      return {
        success: false,
        error: "Automated scans require a Pro or Agency plan. Upgrade in Billing settings.",
      };
    }
    if (!entitlements.canAddWebsite) {
      if (entitlements.isReadOnly) {
        return {
          success: false,
          error: "Your trial has ended or your subscription is inactive. Request an upgrade to continue.",
        };
      }
      return {
        success: false,
        error: `You've reached your limit of ${entitlements.websiteLimit} websites. Request an upgrade to add more.`,
      };
    }

    const slotCheck = await assertCanAddWebsite(userId, url, entitlements.websiteLimit);
    if (!slotCheck.ok) {
      return { success: false, error: slotCheck.error };
    }

    const nextScanAt = computeNextScanAt({
      frequency: scanFrequency,
      timezone: scanTimezone,
      timeOfDay: scanTimeOfDay,
      dayOfWeek: scanDayOfWeek,
      dayOfMonth: scanDayOfMonth,
    });

    const website = await prisma.website.create({
      data: {
        name,
        url: url.toLowerCase(),
        scanFrequency,
        scanTimezone,
        scanTimeOfDay,
        scanDayOfWeek: scanDayOfWeek ?? null,
        scanDayOfMonth: scanDayOfMonth ?? null,
        nextScanAt,
        userId,
      },
    });

    await consumeDomainSlot(userId, website.id, url);

    await prisma.activityLog.create({
      data: {
        userId,
        action: "WEBSITE_CREATED",
        description: `Connected website "${name}" (${url})`,
        metadata: { websiteId: website.id },
      },
    });

    revalidatePath("/dashboard/websites");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings/billing");

    return { success: true, data: website };
  } catch (error) {
    console.error("Add website error:", error);
    return { success: false, error: "Failed to add website. Please try again." };
  }
}

export async function editWebsiteAction(id: string, values: any) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized." };
  }

  const parsed = websiteSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, url, scanFrequency, scanTimezone, scanTimeOfDay, scanDayOfWeek, scanDayOfMonth } =
    parsed.data;
  const userId = session.user.id;

  try {
    const entitlements = await getEntitlements(userId);
    if (
      scanFrequency !== ScanFrequency.MANUAL &&
      !entitlements.canScheduleScans
    ) {
      return {
        success: false,
        error: "Automated scans require a Pro or Agency plan. Upgrade in Billing settings.",
      };
    }

    // Check ownership
    const website = await prisma.website.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!website) {
      return { success: false, error: "Website not found or access denied." };
    }

    // Update website details
    const nextScanAt = computeNextScanAt({
      frequency: scanFrequency,
      timezone: scanTimezone,
      timeOfDay: scanTimeOfDay,
      dayOfWeek: scanDayOfWeek,
      dayOfMonth: scanDayOfMonth,
    });

    const updated = await prisma.website.update({
      where: { id },
      data: {
        name,
        url: url.toLowerCase(),
        scanFrequency,
        scanTimezone,
        scanTimeOfDay,
        scanDayOfWeek: scanDayOfWeek ?? null,
        scanDayOfMonth: scanDayOfMonth ?? null,
        nextScanAt,
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "WEBSITE_UPDATED",
        description: `Updated website "${name}" (${url})`,
        metadata: { websiteId: id },
      },
    });

    revalidatePath("/dashboard/websites");
    revalidatePath(`/dashboard/websites/${id}`);
    revalidatePath("/dashboard");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Edit website error:", error);
    return { success: false, error: "Failed to update website." };
  }
}

export async function getWebsiteDeleteNoticeAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const website = await prisma.website.findFirst({
    where: {
      id,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true, name: true, url: true },
  });

  if (!website) {
    return { success: false, error: "Website not found or access denied." };
  }

  const slot = await getDomainSlotForHost(session.user.id, website.url);
  const notice = getDomainDeleteNotice(slot?.lifetimeAddCount ?? 1);

  return {
    success: true,
    data: {
      websiteName: website.name,
      ...notice,
    },
  };
}

export async function deleteWebsiteAction(id: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { success: false, error: "Unauthorized." };
  }

  const userId = session.user.id;

  try {
    // Check ownership
    const website = await prisma.website.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!website) {
      return { success: false, error: "Website not found or access denied." };
    }

    // Perform soft delete
    const deleted = await prisma.website.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await releaseDomainSlot(userId, website.url);

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId,
        action: "WEBSITE_DELETED",
        description: `Soft-deleted website "${website.name}"`,
        metadata: { websiteId: id },
      },
    });

    revalidatePath("/dashboard/websites");
    revalidatePath("/dashboard");

    return { success: true, message: `Successfully deleted website "${website.name}".` };
  } catch (error) {
    console.error("Delete website error:", error);
    return { success: false, error: "Failed to delete website." };
  }
}
