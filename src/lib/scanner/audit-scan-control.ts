import { prisma } from "@/lib/prisma";
import {
  type AuditPhase,
  AUDIT_PHASES,
  buildAuditStatusMessage,
} from "./audit-phases";
import { AuditCancelledError } from "./audit-cancelled-error";

export const AUDIT_HALTED_MESSAGE = "Halted by user";

export async function isScanCancelled(scanId: string): Promise<boolean> {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { status: true, phase: true },
  });

  return (
    !scan ||
    scan.status !== "RUNNING" ||
    scan.phase === "cancelled"
  );
}

export async function assertScanRunnable(scanId: string) {
  if (await isScanCancelled(scanId)) {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      select: { errorMessage: true },
    });
    throw new AuditCancelledError(scan?.errorMessage ?? AUDIT_HALTED_MESSAGE);
  }
}

export async function updateScanProgress(
  scanId: string,
  phase: AuditPhase,
  context: { host?: string; url?: string; substep?: string } = {}
) {
  const definition = AUDIT_PHASES[phase];
  const statusMessage = buildAuditStatusMessage(phase, context);

  await prisma.scan.updateMany({
    where: { id: scanId, status: "RUNNING" },
    data: {
      phase,
      statusMessage,
      progressPercent: definition.progress,
    },
  });
}

export async function markScanCancelled(scanId: string) {
  await prisma.scan.updateMany({
    where: { id: scanId, status: "RUNNING" },
    data: {
      status: "FAILED",
      phase: "cancelled",
      statusMessage: "Audit halted by user",
      errorMessage: AUDIT_HALTED_MESSAGE,
      completedAt: new Date(),
      progressPercent: 0,
    },
  });
}
