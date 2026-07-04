export const AUDIT_PHASE_ORDER = [
  "queued",
  "initializing",
  "security",
  "browser",
  "navigation",
  "performance",
  "accessibility",
  "seo",
  "finalizing",
  "completed",
] as const;

export type AuditPhase = (typeof AUDIT_PHASE_ORDER)[number];

export interface AuditPhaseDefinition {
  id: AuditPhase;
  label: string;
  progress: number;
  hint: string;
}

export const AUDIT_PHASES: Record<AuditPhase, AuditPhaseDefinition> = {
  queued: {
    id: "queued",
    label: "Queued",
    progress: 3,
    hint: "Waiting for an audit worker to pick up this job.",
  },
  initializing: {
    id: "initializing",
    label: "Preparing",
    progress: 8,
    hint: "Setting up the audit environment and validating the scan.",
  },
  security: {
    id: "security",
    label: "Security",
    progress: 18,
    hint: "Checking HTTPS, response headers, and transport security.",
  },
  browser: {
    id: "browser",
    label: "Browser",
    progress: 24,
    hint: "Launching headless Chrome for lab testing.",
  },
  navigation: {
    id: "navigation",
    label: "Loading page",
    progress: 34,
    hint: "Opening the URL and capturing the DOM snapshot.",
  },
  performance: {
    id: "performance",
    label: "Performance",
    progress: 58,
    hint: "Running Lighthouse with mobile throttling — this is usually the longest step.",
  },
  accessibility: {
    id: "accessibility",
    label: "Accessibility",
    progress: 76,
    hint: "Scanning the page with axe-core for WCAG issues.",
  },
  seo: {
    id: "seo",
    label: "SEO",
    progress: 90,
    hint: "Analyzing metadata, headings, robots.txt, and sitemap signals.",
  },
  finalizing: {
    id: "finalizing",
    label: "Finalizing",
    progress: 97,
    hint: "Saving scores, issues, and updating your dashboard.",
  },
  completed: {
    id: "completed",
    label: "Complete",
    progress: 100,
    hint: "Audit finished successfully.",
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
  const host = context.host ?? context.url?.replace(/^https?:\/\//, "").split("/")[0];

  switch (phase) {
    case "queued":
      return "Queued — waiting for an available audit worker…";
    case "initializing":
      return "Preparing audit engine and validating scan request…";
    case "security":
      return host
        ? `Checking security headers and HTTPS configuration for ${host}…`
        : "Checking security headers and HTTPS configuration…";
    case "browser":
      return "Launching headless Chrome with mobile audit profile…";
    case "navigation":
      return host
        ? `Loading ${host} and capturing page structure…`
        : "Loading page and capturing DOM snapshot…";
    case "performance":
      if (context.substep) return context.substep;
      return host
        ? `Running Lighthouse performance audit on ${host} (mobile, throttled)…`
        : "Running Lighthouse performance audit (mobile, throttled)…";
    case "accessibility":
      return "Running axe-core accessibility scan for WCAG violations…";
    case "seo":
      return host
        ? `Analyzing SEO signals, meta tags, and crawlability for ${host}…`
        : "Analyzing SEO metadata and crawlability…";
    case "finalizing":
      return "Saving scores, findings, and updating your report…";
    case "completed":
      return "Audit complete — results are ready.";
    default:
      return "Audit in progress…";
  }
}

export function lighthouseSubstepMessage(step: string): string {
  const normalized = step.toLowerCase();
  if (normalized.includes("load") || normalized.includes("navig")) {
    return "Lighthouse: loading page under mobile network conditions…";
  }
  if (normalized.includes("trace") || normalized.includes("record")) {
    return "Lighthouse: recording browser trace and network activity…";
  }
  if (normalized.includes("metric") || normalized.includes("analyz")) {
    return "Lighthouse: analyzing Core Web Vitals and performance metrics…";
  }
  if (normalized.includes("audit") || normalized.includes("gather")) {
    return "Lighthouse: gathering performance audits and opportunities…";
  }
  return `Lighthouse: ${step}…`;
}
