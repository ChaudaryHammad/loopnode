export const AUDIT_PHASE_ORDER = [
  "queued",
  "initializing",
  "collecting",
  "analyzing",
  "browser",
  "performance",
  "accessibility",
  "finalizing",
  "completed",
  // Legacy ids kept for in-flight / historical rows
  "security",
  "navigation",
  "seo",
] as const;

export type AuditPhase = (typeof AUDIT_PHASE_ORDER)[number];

export interface AuditPhaseDefinition {
  id: AuditPhase;
  label: string;
  progress: number;
  hint: string;
  /** Maps to UI stepper bucket */
  step?: "collect" | "analyze" | "lab" | "report";
}

export const AUDIT_PHASES: Record<AuditPhase, AuditPhaseDefinition> = {
  queued: {
    id: "queued",
    label: "Queued",
    progress: 3,
    hint: "Waiting for an audit worker…",
    step: "collect",
  },
  initializing: {
    id: "initializing",
    label: "Preparing",
    progress: 8,
    hint: "Setting up the audit engine…",
    step: "collect",
  },
  collecting: {
    id: "collecting",
    label: "Collecting",
    progress: 22,
    hint: "Fetching your page and headers…",
    step: "collect",
  },
  analyzing: {
    id: "analyzing",
    label: "Analyzing",
    progress: 40,
    hint: "Running SEO, security, HTML and more…",
    step: "analyze",
  },
  browser: {
    id: "browser",
    label: "Lab browser",
    progress: 48,
    hint: "Launching headless Chrome for lab testing…",
    step: "lab",
  },
  performance: {
    id: "performance",
    label: "Performance",
    progress: 62,
    hint: "Measuring Core Web Vitals with Lighthouse…",
    step: "lab",
  },
  accessibility: {
    id: "accessibility",
    label: "Accessibility",
    progress: 82,
    hint: "Running accessibility checks…",
    step: "lab",
  },
  finalizing: {
    id: "finalizing",
    label: "Finalizing",
    progress: 96,
    hint: "Saving scores and findings…",
    step: "report",
  },
  completed: {
    id: "completed",
    label: "Complete",
    progress: 100,
    hint: "Audit finished successfully.",
    step: "report",
  },
  // Legacy
  security: {
    id: "security",
    label: "Security",
    progress: 18,
    hint: "Checking security headers…",
    step: "analyze",
  },
  navigation: {
    id: "navigation",
    label: "Loading page",
    progress: 34,
    hint: "Opening the URL…",
    step: "collect",
  },
  seo: {
    id: "seo",
    label: "SEO",
    progress: 90,
    hint: "Analyzing SEO signals…",
    step: "analyze",
  },
};

export function getAuditPhaseIndex(phase: string | null | undefined): number {
  if (!phase) return -1;
  return AUDIT_PHASE_ORDER.indexOf(phase as AuditPhase);
}

export function buildAuditStatusMessage(
  phase: AuditPhase,
  context: { host?: string; url?: string; substep?: string }
): string {
  if (context.substep) return context.substep;

  const host = context.host ?? context.url?.replace(/^https?:\/\//, "").split("/")[0];
  const def = AUDIT_PHASES[phase];

  switch (phase) {
    case "queued":
      return "Queued — waiting for an available audit worker…";
    case "initializing":
      return "Preparing audit engine and validating your target URL…";
    case "collecting":
      return host
        ? `Fetching ${host} and capturing page structure…`
        : "Fetching the target page and capturing structure…";
    case "analyzing":
      return "Analyzing SEO, security, cookies, HTML, technology & assets…";
    case "browser":
      return "Launching lab browser for Lighthouse and accessibility…";
    case "performance":
      return host
        ? `Measuring Core Web Vitals for ${host}…`
        : "Measuring Core Web Vitals with Lighthouse…";
    case "accessibility":
      return "Scanning accessibility with axe-core…";
    case "finalizing":
      return "Saving scores, findings, and updating your report…";
    case "completed":
      return "Audit complete — your report is ready.";
    default:
      return def?.hint ?? "Audit in progress…";
  }
}

export function lighthouseSubstepMessage(step: string): string {
  const normalized = step.toLowerCase();
  if (normalized.includes("load") || normalized.includes("navig")) {
    return "Lighthouse: loading your page in the lab…";
  }
  if (normalized.includes("trace") || normalized.includes("record")) {
    return "Lighthouse: recording performance trace…";
  }
  if (normalized.includes("metric") || normalized.includes("analyz")) {
    return "Lighthouse: analyzing Core Web Vitals…";
  }
  if (normalized.includes("audit") || normalized.includes("gather")) {
    return "Lighthouse: gathering opportunities…";
  }
  return `Lighthouse: ${step.replace(/(?:\.{3}|…)+$/, "")}…`;
}
