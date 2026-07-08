/**
 * Engine progress keys. Broken-links crawl phases are intentionally absent.
 */
export const ENGINE_PHASES = {
  queued: { progress: 3 },
  initializing: { progress: 8 },
  collecting: { progress: 22 },
  analyzing: { progress: 40 },
  lab_launch: { progress: 48 },
  performance: { progress: 62 },
  accessibility: { progress: 82 },
  finalizing: { progress: 96 },
  completed: { progress: 100 },
} as const;

export type EngineProgressKey = keyof typeof ENGINE_PHASES;

export const MODULE_UI_STEPS = [
  { id: "collect", label: "Collect", description: "Fetch page & headers" },
  { id: "analyze", label: "Analyze", description: "SEO · Security · HTML · more" },
  { id: "lab", label: "Lab", description: "Lighthouse & accessibility" },
  { id: "report", label: "Report", description: "Scores & findings" },
] as const;
