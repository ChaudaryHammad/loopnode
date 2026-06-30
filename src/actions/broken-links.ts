"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelTriggerRun } from "@/lib/trigger-cancel";
import { generateBrokenLinksPdf } from "@/lib/reports/generate-broken-links-pdf";
import type { BrokenLinkScanMode } from "@prisma/client";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";
import { z } from "zod";

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
      statusMessage: "Preparing scan…",
      progressPercent: 0,
      startedAt: new Date(),
    },
  });

  return { success: true, data: { scanId: scan.id } };
}

export async function getBrokenLinkScanStatusAction(scanId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
  });

  if (!scan) {
    return { success: false, error: "Scan not found." };
  }

  return { success: true, data: scan };
}

export async function getBrokenLinkScanResultsAction(scanId: string) {
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!scan) {
    return { success: false, error: "Scan not found." };
  }

  return {
    success: true,
    data: scan.results.map((result) => ({
      id: result.id,
      href: result.href,
      sourcePageUrl: result.sourcePageUrl,
      statusCode: result.statusCode,
      errorMessage: result.errorMessage,
      elementTag: result.elementTag,
      elementId: result.elementId,
      elementClass: result.elementClass,
      elementText: result.elementText,
      selector: result.selector,
      attribute: result.attribute,
      severity: result.severity,
    })),
  };
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
      statusMessage: "Scan halted by user",
      errorMessage: "Halted by user",
      completedAt: new Date(),
    },
  });

  await cancelTriggerRun(scan.triggerRunId);

  return { success: true };
}

const brokenLinkFindingSchema = z.object({
  href: z.string(),
  sourcePageUrl: z.string(),
  statusCode: z.number().nullable(),
  errorMessage: z.string().nullable(),
  elementTag: z.string().nullable(),
  elementId: z.string().nullable(),
  elementClass: z.string().nullable(),
  elementText: z.string().nullable(),
  selector: z.string().nullable(),
  attribute: z.string().nullable(),
  severity: z.string(),
});

const generateBrokenLinksPdfSchema = z.object({
  websiteId: z.string().min(1),
  websiteName: z.string().min(1),
  websiteUrl: z.string().url(),
  mode: z.enum(["INTERNAL", "EXTERNAL"]),
  resourceTypes: z.array(z.string()).min(1),
  completedAt: z.string().nullable(),
  pagesCrawled: z.number().int().min(0),
  linksChecked: z.number().int().min(0),
  brokenCount: z.number().int().min(0),
  findings: z.array(brokenLinkFindingSchema),
});

export async function generateBrokenLinksPdfAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized." };
  }

  const parsed = generateBrokenLinksPdfSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid report data.",
    };
  }

  const website = await prisma.website.findFirst({
    where: {
      id: parsed.data.websiteId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!website) {
    return { success: false as const, error: "Website not found." };
  }

  try {
    const buffer = await generateBrokenLinksPdf({
      websiteName: parsed.data.websiteName,
      websiteUrl: parsed.data.websiteUrl,
      mode: parsed.data.mode,
      resourceTypes: parsed.data.resourceTypes as LinkResourceType[],
      completedAt: parsed.data.completedAt,
      pagesCrawled: parsed.data.pagesCrawled,
      linksChecked: parsed.data.linksChecked,
      brokenCount: parsed.data.brokenCount,
      findings: parsed.data.findings,
    });

    const dateLabel = (parsed.data.completedAt ?? new Date().toISOString()).slice(0, 10);
    const safeName = parsed.data.websiteName.replace(/[<>:"/\\|?*]/g, "-").slice(0, 60);
    const filename = `broken-links-${safeName}-${dateLabel}.pdf`;

    return {
      success: true as const,
      data: {
        fileBase64: buffer.toString("base64"),
        filename,
      },
    };
  } catch (error) {
    console.error("Broken links PDF error:", error);
    return { success: false as const, error: "Failed to generate PDF." };
  }
}
