import { prisma } from "@/lib/prisma";

export async function failAuditScan(scanId: string, errorMessage: string) {
  await prisma.scan.updateMany({
    where: { id: scanId, status: "RUNNING" },
    data: {
      status: "FAILED",
      errorMessage,
      statusMessage: errorMessage,
      completedAt: new Date(),
    },
  });
}

export async function reaperStaleRunningScans(maxAgeMs = 12 * 60 * 1000) {
  const staleBefore = new Date(Date.now() - maxAgeMs);
  const result = await prisma.scan.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: staleBefore },
    },
    data: {
      status: "FAILED",
      phase: "failed",
      errorMessage: "Scan timed out or was interrupted. Please try again.",
      statusMessage: "Audit timed out before completion.",
      completedAt: new Date(),
    },
  });
  return result.count;
}
