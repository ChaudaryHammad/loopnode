import type { runBrokenLinkScanTask } from "@/trigger/run-broken-link-scan";
import { useTriggerDev } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { completeBrokenLinkScan } from "@/lib/scanner/complete-broken-link-scan";
import { failBrokenLinkScan } from "@/lib/scanner/fail-broken-link-scan";
import type { LinkResourceType } from "@/lib/scanner/link-resource-types";
import type { BrokenLinkFinding, WwwFallbackResolution } from "@/lib/scanner/types";

export type BrokenLinkRunnerMode = "local" | "trigger";

export function getBrokenLinkRunnerMode(): BrokenLinkRunnerMode {
  return useTriggerDev() ? "trigger" : "local";
}

export async function dispatchBrokenLinkScan(
  scanId: string,
  resourceTypes: LinkResourceType[]
): Promise<{
  mode: BrokenLinkRunnerMode;
  runId?: string;
  findings?: BrokenLinkFinding[];
  wwwFallbacks?: WwwFallbackResolution[];
}> {
  if (getBrokenLinkRunnerMode() === "trigger") {
    const { tasks } = await import("@trigger.dev/sdk");
    const handle = await tasks.trigger<typeof runBrokenLinkScanTask>("run-broken-link-scan", {
      scanId,
      resourceTypes,
    });
    await prisma.brokenLinkScan.update({
      where: { id: scanId },
      data: { triggerRunId: handle.id },
    });
    return { mode: "trigger", runId: handle.id };
  }

  const scan = await prisma.brokenLinkScan.findFirst({
    where: { id: scanId, status: "RUNNING" },
  });

  if (!scan) {
    throw new Error("Scan not found or not runnable.");
  }

  try {
    const result = await completeBrokenLinkScan(scanId, resourceTypes);
    return {
      mode: "local",
      findings: result.findings,
      wwwFallbacks: result.wwwFallbacks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    await failBrokenLinkScan(scanId, message);
    throw error;
  }
}
