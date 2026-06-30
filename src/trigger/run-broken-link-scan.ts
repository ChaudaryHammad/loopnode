import { logger, task } from "@trigger.dev/sdk";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";

export const runBrokenLinkScanTask = task({
  id: "run-broken-link-scan",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  run: async (
    payload: { scanId: string; resourceTypes: LinkResourceType[] },
    { signal }
  ) => {
    logger.info("run-broken-link-scan started", { scanId: payload.scanId });

    const { completeBrokenLinkScan } = await import("@/lib/scanner/complete-broken-link-scan");
    const { failBrokenLinkScan } = await import("@/lib/scanner/fail-broken-link-scan");
    const { ScanCancelledError } = await import("@/lib/scanner/scan-errors");
    const { prisma } = await import("@/lib/prisma");

    const scan = await prisma.brokenLinkScan.findFirst({
      where: { id: payload.scanId, status: "RUNNING" },
      include: {
        website: { select: { id: true, url: true, name: true } },
      },
    });

    if (!scan) {
      const cancelled = await prisma.brokenLinkScan.findFirst({
        where: { id: payload.scanId, phase: "cancelled" },
        select: { id: true },
      });
      if (cancelled || signal.aborted) {
        logger.info("Broken link scan already halted", { scanId: payload.scanId });
        return { scanId: payload.scanId, halted: true, brokenCount: 0 };
      }
      throw new Error("Scan not found or not in RUNNING state.");
    }

    try {
      logger.info("Starting broken link scan", {
        scanId: payload.scanId,
        websiteId: scan.website.id,
        url: scan.website.url,
        mode: scan.mode,
      });

      const result = await completeBrokenLinkScan(
        payload.scanId,
        payload.resourceTypes,
        signal
      );

      logger.info("Broken link scan completed", {
        scanId: payload.scanId,
        brokenCount: result.findings.length,
      });

      return {
        scanId: payload.scanId,
        brokenCount: result.findings.length,
      };
    } catch (error) {
      if (error instanceof ScanCancelledError || signal.aborted) {
        logger.info("Broken link scan halted", { scanId: payload.scanId });
        return {
          scanId: payload.scanId,
          halted: true,
          brokenCount: error instanceof ScanCancelledError ? error.findings.length : 0,
        };
      }

      const message = error instanceof Error ? error.message : "Scan failed";
      logger.error("Broken link scan failed", {
        scanId: payload.scanId,
        message,
      });
      await failBrokenLinkScan(payload.scanId, message);
      throw error;
    }
  },
});
