import { useTriggerDev } from "@/lib/env";

export async function cancelTriggerRun(runId: string | null | undefined): Promise<boolean> {
  if (!runId?.trim() || !useTriggerDev()) {
    return false;
  }

  try {
    const { runs } = await import("@trigger.dev/sdk");
    await runs.cancel(runId);
    return true;
  } catch (error) {
    console.warn("[trigger] Failed to cancel run:", runId, error);
    return false;
  }
}
