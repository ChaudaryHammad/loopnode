import type { AuditModule } from "../core/types";
import { seoModule } from "./seo";
import { securityModule } from "./security";
import { cookiesModule } from "./cookies";
import { htmlValidationModule } from "./html-validation";
import { technologyModule } from "./technology";
import { structuredDataModule } from "./structured-data";
import { assetsModule } from "./assets";
import { accessibilityStaticModule } from "./accessibility-static";
import { performanceModule, accessibilityAxeModule } from "../lab/run-lab";

const ALL: AuditModule[] = [
  seoModule,
  securityModule,
  cookiesModule,
  htmlValidationModule,
  technologyModule,
  structuredDataModule,
  assetsModule,
  accessibilityStaticModule,
  performanceModule,
  accessibilityAxeModule,
];

export const MODULE_REGISTRY = new Map(ALL.map((m) => [m.id, m]));

export function getHttpModules(ids: string[]): AuditModule[] {
  return ids
    .map((id) => MODULE_REGISTRY.get(id))
    .filter((m): m is AuditModule => m != null && !m.requiresLab);
}
