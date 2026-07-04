import type { runAuditTask } from "@/trigger/run-audit";
import { useTriggerDev } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { completeAuditScan } from "@/lib/scanner/complete-audit-scan";
import { failAuditScan } from "@/lib/scanner/fail-audit-scan";
import { updateScanProgress } from "@/lib/scanner/audit-scan-control";
import { AuditCancelledError } from "@/lib/scanner/audit-cancelled-error";

export type AuditRunnerMode = "local" | "trigger";

export function getAuditRunnerMode(): AuditRunnerMode {
  return useTriggerDev() ? "trigger" : "local";
}

export async function dispatchAuditScan(scanId: string): Promise<{
  mode: AuditRunnerMode;
  runId?: string;
  overallScore?: number | null;
}> {
  const scan = await prisma.scan.findFirst({
    where: { id: scanId, status: "RUNNING" },
    include: {
      website: { select: { id: true, name: true, url: true, userId: true } },
    },
  });

  if (!scan) {
    throw new AuditCancelledError("Scan was halted or is no longer running.");
  }

  if (getAuditRunnerMode() === "trigger") {
    const { tasks, runs } = await import("@trigger.dev/sdk");
    const handle = await tasks.trigger<typeof runAuditTask>("run-audit", { scanId });

    const updated = await prisma.scan.updateMany({
      where: { id: scanId, status: "RUNNING" },
      data: {
        triggerRunId: handle.id,
        phase: "queued",
        statusMessage: "Queued — waiting for an available audit worker…",
        progressPercent: 3,
      },
    });

    if (updated.count === 0) {
      try {
        await runs.cancel(handle.id);
      } catch (error) {
        console.warn("Failed to cancel orphaned Trigger.dev run after halt:", error);
      }
      throw new AuditCancelledError("Scan was halted before the worker started.");
    }

    return { mode: "trigger", runId: handle.id };
  }

  try {
    await updateScanProgress(scanId, "initializing", { url: scan.website.url });
    const completed = await completeAuditScan(scanId, scan.website);
    return { mode: "local", overallScore: completed.overallScore };
  } catch (error) {
    if (error instanceof AuditCancelledError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Scan failed";
    await failAuditScan(scanId, message);
    throw error;
  }
}
