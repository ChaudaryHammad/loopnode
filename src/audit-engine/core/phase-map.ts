import type { EngineProgressKey } from "./progress";
import type { AuditPhase } from "@/lib/scanner/audit-phases";

export const ENGINE_PHASE_TO_AUDIT: Record<
  EngineProgressKey,
  { phase: AuditPhase; progress: number }
> = {
  queued: { phase: "queued", progress: 3 },
  initializing: { phase: "initializing", progress: 8 },
  collecting: { phase: "collecting", progress: 22 },
  analyzing: { phase: "analyzing", progress: 40 },
  lab_launch: { phase: "browser", progress: 48 },
  performance: { phase: "performance", progress: 62 },
  accessibility: { phase: "accessibility", progress: 82 },
  finalizing: { phase: "finalizing", progress: 96 },
  completed: { phase: "completed", progress: 100 },
};
