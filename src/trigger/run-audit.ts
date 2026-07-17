import { AbortTaskRunError, logger, queue, task } from "@trigger.dev/sdk";

export const auditQueue = queue({
  name: "audit-scans",
  concurrencyLimit: 3,
});

export const runAuditTask = task({
  id: "run-audit",
  queue: auditQueue,
  machine: { preset: "large-1x" },
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
    factor: 1.5,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 15000,
    randomize: true,
  },
  run: async (payload: { scanId: string }) => {
    logger.info("run-audit started", { scanId: payload.scanId });

    const { prisma } = await import("@/lib/prisma");
    const { completeAuditScan } = await import("@/lib/scanner/complete-audit-scan");
    const { failAuditScan } = await import("@/lib/scanner/fail-audit-scan");
    const { AuditCancelledError } = await import("@/lib/scanner/audit-cancelled-error");
    const { markScanCancelled } = await import("@/lib/scanner/audit-scan-control");

    const { reaperStaleRunningScans } = await import("@/lib/scanner/fail-audit-scan");
    await reaperStaleRunningScans();

    const scan = await prisma.scan.findFirst({
      where: { id: payload.scanId, status: "RUNNING" },
      include: {
        website: { select: { id: true, name: true, url: true, userId: true } },
      },
    });

    if (!scan) {
      throw new AbortTaskRunError("Scan not found or not in RUNNING state.");
    }

    try {
      logger.info("Starting audit scan", {
        scanId: payload.scanId,
        websiteId: scan.website.id,
        url: scan.website.url,
      });
      const completed = await completeAuditScan(payload.scanId, scan.website);
      logger.info("Audit scan completed", {
        scanId: completed.id,
        overallScore: completed.overallScore,
        labEngine: completed.labEngine,
      });
      return {
        scanId: completed.id,
        overallScore: completed.overallScore,
        labEngine: completed.labEngine,
      };
    } catch (error) {
      if (error instanceof AuditCancelledError) {
        await markScanCancelled(payload.scanId);
        logger.info("Audit scan cancelled", { scanId: payload.scanId });
        return { scanId: payload.scanId, cancelled: true };
      }

      const message = error instanceof Error ? error.message : "Scan failed";
      const isInfrastructure =
        /timed out|Could not launch|Chrome|ECONNRESET|ENOTFOUND|socket|network|OOM|memory/i.test(
          message
        );

      logger.error("Audit scan failed", {
        scanId: payload.scanId,
        message,
        isInfrastructure,
      });

      if (!isInfrastructure) {
        await failAuditScan(payload.scanId, message);
        throw new AbortTaskRunError(message);
      }

      throw error;
    }
  },
  onCancel: async ({ payload }) => {
    const { markScanStoppedExternally } = await import("@/lib/scanner/audit-scan-control");
    await markScanStoppedExternally(payload.scanId, {
      cancelled: true,
      message: "Scan cancelled on the audit worker.",
    });
    logger.info("run-audit onCancel synced scan state", { scanId: payload.scanId });
  },
  onFailure: async ({ payload, error }) => {
    const { failAuditScan } = await import("@/lib/scanner/fail-audit-scan");
    const message =
      error instanceof Error
        ? error.message
        : "Scan failed on the audit worker. Please try again.";
    await failAuditScan(payload.scanId, message);
    logger.error("run-audit onFailure synced scan state", {
      scanId: payload.scanId,
      message,
    });
  },
});
