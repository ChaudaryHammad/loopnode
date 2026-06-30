import type { runAuditTask } from "@/trigger/run-audit";
import { useTriggerDev } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { completeAuditScan } from "@/lib/scanner/complete-audit-scan";
import { failAuditScan } from "@/lib/scanner/fail-audit-scan";

export type AuditRunnerMode = "local" | "trigger";

export function getAuditRunnerMode(): AuditRunnerMode {
  return useTriggerDev() ? "trigger" : "local";
}

export async function dispatchAuditScan(scanId: string): Promise<{
  mode: AuditRunnerMode;
  runId?: string;
  overallScore?: number | null;
}> {
  if (getAuditRunnerMode() === "trigger") {
    const { tasks } = await import("@trigger.dev/sdk");
    const handle = await tasks.trigger<typeof runAuditTask>("run-audit", { scanId });
    await prisma.scan.update({
      where: { id: scanId },
      data: { triggerRunId: handle.id },
    });
    return { mode: "trigger", runId: handle.id };
  }

  const scan = await prisma.scan.findFirst({
    where: { id: scanId, status: "RUNNING" },
    include: {
      website: { select: { id: true, name: true, url: true, userId: true } },
    },
  });

  if (!scan) {
    throw new Error("Scan not found or not runnable.");
  }

  try {
    const completed = await completeAuditScan(scanId, scan.website);
    return { mode: "local", overallScore: completed.overallScore };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    await failAuditScan(scanId, message);
    throw error;
  }
}
