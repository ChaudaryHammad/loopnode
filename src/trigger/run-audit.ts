import { logger, task } from "@trigger.dev/sdk";

export const runAuditTask = task({
  id: "run-audit",
  maxDuration: 300,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { scanId: string }) => {
    logger.info("run-audit started", { scanId: payload.scanId });

    const { prisma } = await import("@/lib/prisma");
    const { completeAuditScan } = await import("@/lib/scanner/complete-audit-scan");
    const { failAuditScan } = await import("@/lib/scanner/fail-audit-scan");

    const scan = await prisma.scan.findFirst({
      where: { id: payload.scanId, status: "RUNNING" },
      include: {
        website: { select: { id: true, name: true, url: true, userId: true } },
      },
    });

    if (!scan) {
      throw new Error("Scan not found or not in RUNNING state.");
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
      });
      return {
        scanId: completed.id,
        overallScore: completed.overallScore,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed";
      logger.error("Audit scan failed", {
        scanId: payload.scanId,
        message,
      });
      await failAuditScan(payload.scanId, message);
      throw error;
    }
  },
});
