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

export async function dispatchAuditScan(
  scanId: string,
  options?: { forceTrigger?: boolean }
): Promise<{
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

  // Already queued — avoid duplicate Trigger workers for the same scan.
  if (scan.triggerRunId && !options?.forceTrigger) {
    return { mode: "trigger", runId: scan.triggerRunId };
  }

  // Never run Chrome/Lighthouse on Vercel serverless — control plane only.
  const onVercel = Boolean(process.env.VERCEL);
  const preferTrigger =
    options?.forceTrigger === true || getAuditRunnerMode() === "trigger" || onVercel;

  if (preferTrigger) {
    if (!useTriggerDev() && onVercel) {
      throw new Error(
        "Audits must run on Trigger.dev in production. Set USE_TRIGGER_DEV=true and TRIGGER_SECRET_KEY."
      );
    }
    const { tasks, runs } = await import("@trigger.dev/sdk");
    const handle = await tasks.trigger<typeof runAuditTask>(
      "run-audit",
      { scanId },
      {
        machine: "large-1x",
        idempotencyKey: `audit:${scanId}`,
        idempotencyKeyTTL: "2h",
      }
    );

    const updated = await prisma.scan.updateMany({
      where: {
        id: scanId,
        status: "RUNNING",
        OR: [{ triggerRunId: null }, { triggerRunId: handle.id }],
      },
      data: {
        triggerRunId: handle.id,
        phase: "queued",
        statusMessage: "Queued — waiting for an available audit worker…",
        progressPercent: 3,
      },
    });

    if (updated.count === 0) {
      const current = await prisma.scan.findFirst({
        where: { id: scanId },
        select: { status: true, triggerRunId: true },
      });

      if (current?.status === "RUNNING" && current.triggerRunId) {
        // Another dispatcher won the race; cancel our duplicate if different.
        if (current.triggerRunId !== handle.id) {
          try {
            await runs.cancel(handle.id);
          } catch (error) {
            console.warn("Failed to cancel duplicate Trigger.dev run:", error);
          }
        }
        return { mode: "trigger", runId: current.triggerRunId };
      }

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
