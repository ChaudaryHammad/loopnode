import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runBrokenLinkEngine } from "@/broken-links";
import { countUniqueBrokenHrefs } from "@/broken-links/group-results";
import {
  createProgressWriter,
  createResultPersister,
} from "@/broken-links/persist";
import { ScanCancelledError } from "@/lib/scanner/scan-errors";
import { parseResourceTypes } from "@/lib/scanner/link-resource-types";
import type { BrokenLinkFinding, WwwFallbackResolution } from "@/broken-links/types";

export const maxDuration = 300;

function scanResponse(
  uniqueBrokenCount: number,
  occurrenceCount: number,
  wwwFallbacks: WwwFallbackResolution[] = [],
  extra?: Record<string, unknown>
) {
  return NextResponse.json({
    success: true,
    brokenCount: uniqueBrokenCount,
    occurrenceCount,
    wwwFallbacks,
    ...extra,
  });
}

function finalStatusMessage(
  uniqueBrokenCount: number,
  occurrenceCount: number,
  wwwFallbacks: WwwFallbackResolution[],
  capped: boolean
) {
  const fallbackCount = wwwFallbacks.length;
  const capNote = capped ? " (scan may be partial — server time limit)" : "";
  const occurrenceNote =
    occurrenceCount > uniqueBrokenCount
      ? ` (${occurrenceCount} page occurrence${occurrenceCount === 1 ? "" : "s"})`
      : "";
  if (fallbackCount === 0) {
    return `Found ${uniqueBrokenCount} broken URL(s)${occurrenceNote}${capNote}`;
  }
  return `Found ${uniqueBrokenCount} broken URL(s)${occurrenceNote}; ${fallbackCount} worked on www. instead${capNote}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { resourceTypes?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: {
      id: scanId,
      website: { userId: session.user.id, deletedAt: null },
    },
    include: { website: { select: { url: true, name: true, userId: true } } },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status !== "RUNNING") {
    return NextResponse.json({ error: "Scan is not runnable" }, { status: 409 });
  }

  await prisma.brokenLinkResult.deleteMany({ where: { scanId } });

  const progressWriter = createProgressWriter(scanId);
  const resultPersister = createResultPersister(scanId);

  const shouldCancel = async () => {
    const current = await prisma.brokenLinkScan.findUnique({
      where: { id: scanId },
      select: { status: true, phase: true },
    });
    return current?.status === "FAILED" && current?.phase === "cancelled";
  };

  try {
    const resourceTypes = parseResourceTypes(body.resourceTypes);

    const result = await runBrokenLinkEngine({
      startUrl: scan.website.url,
      mode: scan.mode,
      resourceTypes,
      shouldCancel,
      onProgress: async (progress) => {
        if (await shouldCancel()) return;
        await progressWriter.update(progress);
      },
      onFindings: (batch) => {
        resultPersister.push(batch);
      },
    });

    await progressWriter.flush();
    await resultPersister.flush();

    const { findings, wwwFallbacks, capped, uniqueBrokenCount, occurrenceCount } = result;

    const alreadyCancelled = await shouldCancel();
    if (alreadyCancelled) {
      return scanResponse(uniqueBrokenCount, occurrenceCount, wwwFallbacks, {
        cancelled: true,
        capped,
      });
    }

    await prisma.brokenLinkScan.update({
      where: { id: scanId },
      data: {
        status: "COMPLETED",
        phase: "completed",
        statusMessage: finalStatusMessage(
          uniqueBrokenCount,
          occurrenceCount,
          wwwFallbacks,
          capped
        ),
        pagesCrawled: result.pagesCrawled,
        linksChecked: result.linksChecked,
        linksFound: Math.max(result.linksChecked, uniqueHrefsCount(findings)),
        brokenCount: uniqueBrokenCount,
        progressPercent: 100,
        completedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: scan.website.userId,
        action: "BROKEN_LINK_SCAN_COMPLETED",
        description: `Broken link scan (${scan.mode.toLowerCase()}) for "${scan.website.name}" — ${uniqueBrokenCount} broken URL(s), ${occurrenceCount} occurrence(s)`,
        metadata: {
          websiteId: scan.websiteId,
          scanId,
          mode: scan.mode,
          brokenCount: uniqueBrokenCount,
          occurrenceCount,
          wwwFallbackCount: wwwFallbacks.length,
          capped,
        },
      },
    });

    return scanResponse(uniqueBrokenCount, occurrenceCount, wwwFallbacks, { capped });
  } catch (error) {
    await progressWriter.flush().catch(() => undefined);
    await resultPersister.flush().catch(() => undefined);

    if (error instanceof ScanCancelledError) {
      const findings = error.findings as BrokenLinkFinding[];
      const uniqueBrokenCount = countUniqueBrokenHrefs(findings);
      const occurrenceCount = findings.length;

      await prisma.brokenLinkScan.update({
        where: { id: scanId },
        data: {
          status: "FAILED",
          phase: "cancelled",
          statusMessage: "Scan halted by user",
          errorMessage: "Halted by user",
          brokenCount: uniqueBrokenCount,
          completedAt: new Date(),
        },
      });

      return scanResponse(uniqueBrokenCount, occurrenceCount, error.wwwFallbacks, {
        cancelled: true,
      });
    }

    console.error("Broken link scan error:", error);
    await prisma.brokenLinkScan.update({
      where: { id: scanId },
      data: {
        status: "FAILED",
        phase: "failed",
        errorMessage: error instanceof Error ? error.message : "Scan failed",
        statusMessage: "Scan failed",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}

function uniqueHrefsCount(findings: BrokenLinkFinding[]): number {
  return countUniqueBrokenHrefs(findings);
}
