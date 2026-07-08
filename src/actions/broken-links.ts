"use server";

import { unstable_noStore as noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BrokenLinkScanMode } from "@prisma/client";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";

const STALE_SCAN_MS = 5 * 60 * 1000;

async function clearStaleRunningScans(websiteId: string) {
  const staleBefore = new Date(Date.now() - STALE_SCAN_MS);
  await prisma.brokenLinkScan.updateMany({
    where: {
      websiteId,
      status: "RUNNING",
      startedAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      phase: "failed",
      statusMessage: "Scan timed out",
      errorMessage: "Scan was interrupted or timed out. Please try again.",
      completedAt: new Date(),
    },
  });
}

export async function startBrokenLinkScanAction(
  websiteId: string,
  mode: BrokenLinkScanMode,
  resourceTypes: LinkResourceType[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  if (!resourceTypes.length) {
    return { success: false, error: "Select at least one link type to check." };
  }

  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId: session.user.id, deletedAt: null },
  });

  if (!website) {
    return { success: false, error: "Website not found." };
  }

  await clearStaleRunningScans(websiteId);

  const running = await prisma.brokenLinkScan.findFirst({
    where: { websiteId, status: "RUNNING" },
  });

  if (running) {
    return {
      success: false,
      error: "A broken link scan is already running. Wait for it to finish or refresh in a few minutes.",
    };
  }

  const scan = await prisma.brokenLinkScan.create({
    data: {
      websiteId,
      mode,
      status: "RUNNING",
      phase: "initializing",
      statusMessage: "Preparing link check…",
      progressPercent: 0,
      startedAt: new Date(),
    },
  });

  return { success: true, data: { scanId: scan.id } };
}

export async function getBrokenLinkScanStatusAction(scanId: string) {
  noStore();
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    include: {
      results: {
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
        take: 200,
      },
    },
  });

  if (!scan) {
    return { success: false, error: "Scan not found." };
  }

  return { success: true, data: scan };
}

export async function getBrokenLinkResultsAction(scanId: string) {
  noStore();
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    select: { id: true },
  });

  if (!scan) {
    return { success: false, error: "Scan not found." };
  }

  const results = await prisma.brokenLinkResult.findMany({
    where: { scanId },
    orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
  });

  return { success: true, data: results };
}

export async function getLatestBrokenLinkScanAction(websiteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      websiteId,
      website: { userId: session.user.id, deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: scan };
}

export async function cancelBrokenLinkScanAction(scanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: scanId,
      status: "RUNNING",
      website: { userId: session.user.id, deletedAt: null },
    },
  });

  if (!scan) {
    return { success: false, error: "No running scan found to halt." };
  }

  await prisma.brokenLinkScan.update({
    where: { id: scanId },
    data: {
      status: "FAILED",
      phase: "cancelled",
      statusMessage: "Scan stopped",
      errorMessage: "Halted by user",
      completedAt: new Date(),
    },
  });

  revalidatePath(`/dashboard/websites/${scan.websiteId}`);

  return { success: true };
}
