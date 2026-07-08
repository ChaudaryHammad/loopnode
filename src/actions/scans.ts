"use server";

import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  AUDIT_HALTED_MESSAGE,
  markScanCancelled,
} from "@/lib/scanner/audit-scan-control";
import { reaperStaleRunningScans } from "@/lib/scanner/fail-audit-scan";
import { syncTriggerRunForScan } from "@/lib/scanner/sync-trigger-run";
import { useTriggerDev } from "@/lib/env";

const STALE_SCAN_MS = 10 * 60 * 1000;

async function clearStaleRunningScans(websiteId: string) {
  const staleBefore = new Date(Date.now() - STALE_SCAN_MS);
  await prisma.scan.updateMany({
    where: {
      websiteId,
      status: "RUNNING",
      startedAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      phase: "failed",
      errorMessage: "Scan timed out or was interrupted. Please try again.",
      statusMessage: "Audit timed out before completion.",
      completedAt: new Date(),
    },
  });
}

export async function startScanAction(websiteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const userId = session.user.id;

  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId, deletedAt: null },
  });

  if (!website) {
    return { success: false, error: "Website not found or access denied." };
  }

  await clearStaleRunningScans(websiteId);
  await reaperStaleRunningScans();

  const running = await prisma.scan.findFirst({
    where: { websiteId, status: "RUNNING" },
  });
  if (running) {
    return {
      success: false,
      error: "A scan is already running for this website.",
      data: { scanId: running.id },
    };
  }

  const scan = await prisma.scan.create({
    data: {
      websiteId,
      status: "RUNNING",
      startedAt: new Date(),
      phase: "queued",
      statusMessage: "Preparing your premium URL audit…",
      progressPercent: 2,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  revalidatePath(`/dashboard/websites/${websiteId}`);

  return { success: true, data: { scanId: scan.id } };
}

export async function getScanStatusAction(scanId: string) {
  noStore();
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      phase: true,
      statusMessage: true,
      progressPercent: true,
      overallScore: true,
      performanceScore: true,
      accessibilityScore: true,
      seoScore: true,
      securityScore: true,
      fcp: true,
      lcp: true,
      cls: true,
      inp: true,
      tbt: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      _count: { select: { issues: true } },
      issues: {
        where: { severity: "CRITICAL" },
        select: { id: true },
      },
    },
  });

  if (!scan) return { success: false, error: "Scan not found." };

  if (scan.status === "RUNNING") {
    await syncTriggerRunForScan(scanId);
  }

  const latest = await prisma.scan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    select: {
      id: true,
      status: true,
      phase: true,
      statusMessage: true,
      progressPercent: true,
      overallScore: true,
      performanceScore: true,
      accessibilityScore: true,
      seoScore: true,
      securityScore: true,
      fcp: true,
      lcp: true,
      cls: true,
      inp: true,
      tbt: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      _count: { select: { issues: true } },
      issues: {
        where: { severity: "CRITICAL" },
        select: { id: true },
      },
    },
  });

  if (!latest) return { success: false, error: "Scan not found." };

  const { _count, issues, ...rest } = latest;

  return {
    success: true,
    data: {
      ...rest,
      issueCount: _count.issues,
      criticalCount: issues.length,
    },
  };
}

export async function cancelScanAction(scanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      status: "RUNNING",
      website: { userId: session.user.id, deletedAt: null },
    },
    include: { website: { select: { id: true, name: true } } },
  });

  if (!scan) {
    const existing = await prisma.scan.findFirst({
      where: {
        id: scanId,
        website: { userId: session.user.id, deletedAt: null },
      },
      select: { phase: true, status: true },
    });

    if (existing?.phase === "cancelled" || existing?.status === "FAILED") {
      return { success: true, message: AUDIT_HALTED_MESSAGE };
    }

    return { success: false, error: "No running audit found to stop." };
  }

  // Mark halted in DB first so workers stop at the next checkpoint.
  await markScanCancelled(scanId);

  if (scan.triggerRunId && useTriggerDev()) {
    try {
      const { runs } = await import("@trigger.dev/sdk");
      await runs.cancel(scan.triggerRunId);
    } catch (error) {
      console.error("Failed to cancel Trigger.dev run:", error);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  revalidatePath(`/dashboard/websites/${scan.website.id}`);

  return { success: true, message: AUDIT_HALTED_MESSAGE };
}

export async function getScanDetailsAction(scanId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    include: {
      issues: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
      website: { select: { id: true, name: true, url: true } },
    },
  });

  if (!scan) return { success: false, error: "Scan not found." };

  return { success: true, data: scan };
}
