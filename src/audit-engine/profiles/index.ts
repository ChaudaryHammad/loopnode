import type { AuditProfileId } from "../core/types";

export interface AuditProfile {
  id: AuditProfileId;
  label: string;
  enableLab: boolean;
  httpModuleIds: string[];
  labModuleIds: string[];
}

const HTTP_MODULES = [
  "seo",
  "security",
  "cookies",
  "html-validation",
  "technology",
  "structured-data",
  "assets",
  "accessibility-static",
] as const;

export const AUDIT_PROFILES: Record<AuditProfileId, AuditProfile> = {
  quick: {
    id: "quick",
    label: "Quick",
    enableLab: false,
    httpModuleIds: [...HTTP_MODULES],
    labModuleIds: [],
  },
  standard: {
    id: "standard",
    label: "Standard",
    enableLab: true,
    httpModuleIds: [...HTTP_MODULES],
    labModuleIds: ["performance", "accessibility-axe"],
  },
  premium: {
    id: "premium",
    label: "Premium",
    enableLab: true,
    httpModuleIds: [...HTTP_MODULES],
    labModuleIds: ["performance", "accessibility-axe"],
  },
};

/** V1 product default — mobile Lighthouse parity within Trigger 5m. */
export const DEFAULT_AUDIT_PROFILE: AuditProfileId = "standard";

export function resolveAuditProfile(id?: AuditProfileId | null): AuditProfile {
  return AUDIT_PROFILES[id ?? DEFAULT_AUDIT_PROFILE] ?? AUDIT_PROFILES.standard;
}
