import { logger, schedules } from "@trigger.dev/sdk";
import { ScanFrequency } from "@prisma/client";

export const scheduledScansTask = schedules.task({
  id: "scheduled-scans",
  cron: "0 * * * *",
  run: async () => {
    const { prisma } = await import("@/lib/prisma");
    const { dispatchAuditScan } = await import("@/lib/audit-dispatch");
    const { computeNextScanAt } = await import("@/lib/scan-schedule");
    const { getEntitlements } = await import("@/lib/entitlements");

    const { reaperStaleRunningScans } = await import("@/lib/scanner/fail-audit-scan");
    await reaperStaleRunningScans();

    const now = new Date();
    const dueWebsites = await prisma.website.findMany({
      where: {
        deletedAt: null,
        scanFrequency: { not: ScanFrequency.MANUAL },
        nextScanAt: { lte: now },
      },
      select: {
        id: true,
        name: true,
        url: true,
        userId: true,
        scanFrequency: true,
        scanTimezone: true,
        scanTimeOfDay: true,
        scanDayOfWeek: true,
        scanDayOfMonth: true,
      },
      take: 25,
      orderBy: { nextScanAt: "asc" },
    });

    logger.info("Scheduled scan tick", { dueCount: dueWebsites.length });

    let started = 0;
    let skipped = 0;

    for (const website of dueWebsites) {
      const entitlements = await getEntitlements(website.userId);
      if (!entitlements.canScheduleScans || entitlements.isReadOnly) {
        skipped += 1;
        await prisma.website.update({
          where: { id: website.id },
          data: {
            nextScanAt: computeNextScanAt({
              frequency: website.scanFrequency,
              timezone: website.scanTimezone,
              timeOfDay: website.scanTimeOfDay,
              dayOfWeek: website.scanDayOfWeek,
              dayOfMonth: website.scanDayOfMonth,
            }),
          },
        });
        continue;
      }

      const running = await prisma.scan.findFirst({
        where: { websiteId: website.id, status: "RUNNING" },
      });
      if (running) {
        skipped += 1;
        continue;
      }

      const scan = await prisma.scan.create({
        data: {
          websiteId: website.id,
          status: "RUNNING",
          startedAt: new Date(),
          phase: "queued",
          statusMessage: "Scheduled audit queued…",
          progressPercent: 2,
        },
      });

      try {
        await dispatchAuditScan(scan.id);
        started += 1;

        await prisma.website.update({
          where: { id: website.id },
          data: {
            lastScheduledAt: now,
            nextScanAt: computeNextScanAt(
              {
                frequency: website.scanFrequency,
                timezone: website.scanTimezone,
                timeOfDay: website.scanTimeOfDay,
                dayOfWeek: website.scanDayOfWeek,
                dayOfMonth: website.scanDayOfMonth,
              },
              now
            ),
          },
        });

        await prisma.activityLog.create({
          data: {
            userId: website.userId,
            action: "SCAN_STARTED",
            description: `Scheduled audit started for "${website.name}"`,
            metadata: { websiteId: website.id, scanId: scan.id, scheduled: true },
          },
        });
      } catch (error) {
        logger.error("Failed to dispatch scheduled scan", {
          websiteId: website.id,
          scanId: scan.id,
          error: error instanceof Error ? error.message : "unknown",
        });
        skipped += 1;
      }
    }

    return { due: dueWebsites.length, started, skipped };
  },
});
