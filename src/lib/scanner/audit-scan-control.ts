import { prisma } from "@/lib/prisma";
import { AuditHaltedError } from "./audit-halted-error";

export const AUDIT_HALTED_MESSAGE = "Halted by user";

export async function assertScanRunnable(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { status: true, errorMessage: true },
  });

  if (!scan || scan.status !== "RUNNING") {
    if (scan?.errorMessage === AUDIT_HALTED_MESSAGE) {
      throw new AuditHaltedError();
    }
    throw new Error(scan?.errorMessage ?? "Scan is no longer running.");
  }
}

export async function isAuditScanCancelled(scanId: string): Promise<boolean> {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { status: true, errorMessage: true },
  });

  return scan?.status === "FAILED" && scan.errorMessage === AUDIT_HALTED_MESSAGE;
}
