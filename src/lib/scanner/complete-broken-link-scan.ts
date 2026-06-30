import { prisma } from "@/lib/prisma";
import type { LinkResourceType } from "./link-resource-types";
import { runBrokenLinkScan } from "./broken-link-runner";
import { ScanCancelledError } from "./scan-errors";
import type { BrokenLinkFinding, WwwFallbackResolution } from "./types";

function finalStatusMessage(
  brokenCount: number,
  wwwFallbacks: WwwFallbackResolution[]
) {
  const fallbackCount = wwwFallbacks.length;
  if (fallbackCount === 0) return `Found ${brokenCount} broken link(s)`;
  return `Found ${brokenCount} broken link(s); ${fallbackCount} worked on www. instead`;
}

function mapFindingsForDb(findings: BrokenLinkFinding[]) {
  return findings.map((finding) => ({
    href: finding.href,
    sourcePageUrl: finding.sourcePageUrl,
    statusCode: finding.statusCode,
    errorMessage: finding.errorMessage,
    elementTag: finding.elementTag,
    elementId: finding.elementId ?? null,
    elementClass: finding.elementClass ?? null,
    elementText: finding.elementText ?? null,
    selector: finding.selector,
    attribute: finding.attribute,
    severity: finding.severity,
  }));
}

async function persistBrokenLinkResults(
  scanId: string,
  findings: BrokenLinkFinding[],
  wwwFallbacks: WwwFallbackResolution[],
  website: { id: string; name: string; userId: string; url: string },
  scanMeta: {
    mode: string;
    status: "COMPLETED" | "FAILED";
    phase: string;
    statusMessage: string;
    errorMessage?: string | null;
  }
) {
  await prisma.$transaction(async (tx) => {
    await tx.brokenLinkResult.deleteMany({ where: { scanId } });

    if (findings.length > 0) {
      await tx.brokenLinkResult.createMany({
        data: mapFindingsForDb(findings).map((row) => ({
          scanId,
          ...row,
        })),
      });
    }

    await tx.brokenLinkScan.update({
      where: { id: scanId },
      data: {
        status: scanMeta.status,
        phase: scanMeta.phase,
        statusMessage: scanMeta.statusMessage,
        brokenCount: findings.length,
        progressPercent: scanMeta.status === "COMPLETED" ? 100 : undefined,
        errorMessage: scanMeta.errorMessage ?? null,
        completedAt: new Date(),
      },
    });

    if (scanMeta.status === "COMPLETED") {
      await tx.activityLog.create({
        data: {
          userId: website.userId,
          action: "BROKEN_LINK_SCAN_COMPLETED",
          description: `Broken link scan (${scanMeta.mode.toLowerCase()}) for "${website.name}" — ${findings.length} issue(s)`,
          metadata: {
            websiteId: website.id,
            scanId,
            mode: scanMeta.mode,
            brokenCount: findings.length,
            wwwFallbackCount: wwwFallbacks.length,
          },
        },
      });
    }
  });
}

export async function completeBrokenLinkScan(
  scanId: string,
  resourceTypes: LinkResourceType[],
  abortSignal?: AbortSignal
): Promise<{
  findings: BrokenLinkFinding[];
  wwwFallbacks: WwwFallbackResolution[];
}> {
  const scan = await prisma.brokenLinkScan.findFirst({
    where: { id: scanId, status: "RUNNING" },
    include: {
      website: { select: { id: true, name: true, url: true, userId: true } },
    },
  });

  if (!scan) {
    throw new Error("Scan not found or not runnable.");
  }

  const shouldCancel = async () => {
    if (abortSignal?.aborted) return true;

    const current = await prisma.brokenLinkScan.findUnique({
      where: { id: scanId },
      select: { status: true, phase: true },
    });
    return current?.status === "FAILED" && current?.phase === "cancelled";
  };

  try {
    const result = await runBrokenLinkScan(
      scan.website.url,
      scan.mode,
      resourceTypes,
      async (progress) => {
        const cancelled = await shouldCancel();
        if (cancelled) return;

        await prisma.brokenLinkScan.update({
          where: { id: scanId },
          data: {
            status: "RUNNING",
            phase: progress.phase,
            statusMessage: progress.statusMessage,
            pagesDiscovered: progress.pagesDiscovered,
            pagesCrawled: progress.pagesCrawled,
            linksFound: progress.linksFound,
            linksChecked: progress.linksChecked,
            brokenCount: progress.brokenCount,
            progressPercent: progress.progressPercent,
          },
        });
      },
      shouldCancel
    );

    const alreadyCancelled = await shouldCancel();
    if (alreadyCancelled) {
      await persistBrokenLinkResults(scanId, result.findings, result.wwwFallbacks, scan.website, {
        mode: scan.mode,
        status: "FAILED",
        phase: "cancelled",
        statusMessage: "Scan halted by user",
        errorMessage: "Halted by user",
      });
      return result;
    }

    await persistBrokenLinkResults(scanId, result.findings, result.wwwFallbacks, scan.website, {
      mode: scan.mode,
      status: "COMPLETED",
      phase: "completed",
      statusMessage: finalStatusMessage(result.findings.length, result.wwwFallbacks),
    });

    return result;
  } catch (error) {
    if (error instanceof ScanCancelledError) {
      await persistBrokenLinkResults(scanId, error.findings, error.wwwFallbacks, scan.website, {
        mode: scan.mode,
        status: "FAILED",
        phase: "cancelled",
        statusMessage: "Scan halted by user",
        errorMessage: "Halted by user",
      });
      return { findings: error.findings, wwwFallbacks: error.wwwFallbacks };
    }

    throw error;
  }
}
