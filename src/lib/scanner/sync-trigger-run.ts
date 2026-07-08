import { prisma } from "@/lib/prisma";
import { useTriggerDev } from "@/lib/env";
import { failAuditScan } from "@/lib/scanner/fail-audit-scan";
import { markScanStoppedExternally } from "@/lib/scanner/audit-scan-control";

type TriggerTerminalStatus =
  | "COMPLETED"
  | "CANCELED"
  | "FAILED"
  | "CRASHED"
  | "SYSTEM_FAILURE"
  | "EXPIRED"
  | "TIMED_OUT";

function messageForTriggerStatus(
  status: TriggerTerminalStatus,
  errorMessage?: string
): { cancelled: boolean; message: string } {
  switch (status) {
    case "CANCELED":
      return {
        cancelled: true,
        message: "Scan cancelled on the audit worker.",
      };
    case "TIMED_OUT":
    case "EXPIRED":
      return {
        cancelled: false,
        message: "Scan timed out on the audit worker. Please try again.",
      };
    case "CRASHED":
    case "SYSTEM_FAILURE":
      return {
        cancelled: false,
        message: errorMessage ?? "Scan crashed on the audit worker. Please try again.",
      };
    case "FAILED":
      return {
        cancelled: false,
        message: errorMessage ?? "Scan failed on the audit worker.",
      };
    case "COMPLETED":
      return {
        cancelled: false,
        message: "Audit worker finished but results were not saved. Please run again.",
      };
    default:
      return {
        cancelled: false,
        message: errorMessage ?? "Scan ended unexpectedly on the audit worker.",
      };
  }
}

/**
 * If a Trigger.dev run has finished but the Scan row is still RUNNING, sync terminal state.
 * Returns true when the scan row was updated.
 */
export async function syncTriggerRunForScan(scanId: string): Promise<boolean> {
  if (!useTriggerDev()) return false;

  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    select: { id: true, status: true, triggerRunId: true },
  });

  if (!scan || scan.status !== "RUNNING" || !scan.triggerRunId) {
    return false;
  }

  try {
    const { runs } = await import("@trigger.dev/sdk");
    const run = await runs.retrieve(scan.triggerRunId);

    if (!run.isCompleted) {
      return false;
    }

    const errorMessage =
      run.error && typeof run.error === "object" && "message" in run.error
        ? String(run.error.message)
        : undefined;

    if (run.isCancelled) {
      await markScanStoppedExternally(scan.id, {
        cancelled: true,
        message: "Scan cancelled on the audit worker.",
      });
      return true;
    }

    if (run.isFailed) {
      const { cancelled, message } = messageForTriggerStatus(
        run.status as TriggerTerminalStatus,
        errorMessage
      );
      await markScanStoppedExternally(scan.id, { cancelled, message });
      return true;
    }

    if (run.isSuccess) {
      const { message } = messageForTriggerStatus("COMPLETED");
      await failAuditScan(scan.id, message);
      return true;
    }

    return false;
  } catch (error) {
    console.warn("Failed to sync Trigger.dev run for scan:", scanId, error);
    return false;
  }
}
