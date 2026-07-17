import type { IssueSeverity } from "@prisma/client";

export type AuditProfileId = "quick" | "standard" | "premium";

export type AuditFindingCategory =
  | "PERFORMANCE"
  | "ACCESSIBILITY"
  | "SEO"
  | "SECURITY";

export interface AuditFinding {
  category: AuditFindingCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  selector?: string | null;
  url?: string | null;
  recommendation?: string | null;
  metadata?: Record<string, unknown>;
  moduleId: string;
}

export interface ModuleResult {
  moduleId: string;
  status: "completed" | "failed" | "skipped";
  score: number | null;
  findings: AuditFinding[];
  metrics?: Record<string, number | string | boolean | null>;
  durationMs: number;
  error?: string;
}

export interface ResponseArtifact {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  redirectChain: string[];
  timingMs: number;
  body: string | null;
  contentType: string | null;
}

export interface DomArtifact {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  h1Texts: string[];
  h1Count: number;
  images: Array<{ src: string | null; alt: string | null; selector: string }>;
  links: Array<{
    href: string;
    text: string;
    rel: string | null;
    isInternal: boolean;
  }>;
  scripts: string[];
  stylesheets: string[];
  jsonLdBlocks: string[];
  htmlLang: string | null;
  doctypePresent: boolean;
  rawHtml: string;
}

export interface SiteProbe {
  robotsStatus: number | null;
  robotsBody: string | null;
  sitemapStatus: number | null;
}

export interface LabMetrics {
  score: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  engine: "lighthouse" | "failed";
  failureReason: string | null;
  lighthouseReportUrl: string | null;
  findings: AuditFinding[];
}

export interface AuditMeta {
  auditId: string;
  websiteId: string;
  targetUrl: string;
  host: string;
  profile: AuditProfileId;
  enableLab: boolean;
  device: "desktop" | "mobile";
}

/** Shared blackboard for one Target URL audit. No crawl frontier. */
export interface ScanContext {
  meta: AuditMeta;
  response: ResponseArtifact | null;
  dom: DomArtifact | null;
  siteProbe: SiteProbe | null;
  lab: LabMetrics | null;
  modules: ModuleResult[];
}

export interface AuditEngineResult {
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  securityScore: number;
  overallScore: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  labEngine: "lighthouse" | "failed" | "skipped" | null;
  lighthouseReportUrl: string | null;
  issues: Array<Omit<AuditFinding, "moduleId"> & { moduleId?: string }>;
  moduleResults: ModuleResult[];
}

export interface AuditModule {
  id: string;
  label: string;
  /** When true, module runs only if Lab is enabled in the profile. */
  requiresLab?: boolean;
  run: (ctx: ScanContext) => Promise<ModuleResult>;
}
