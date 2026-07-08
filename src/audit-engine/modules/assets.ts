import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireDom, scoreFromFindings } from "./_helpers";

export const assetsModule: AuditModule = {
  id: "assets",
  label: "Assets",
  async run(ctx) {
    const started = Date.now();
    try {
      const dom = requireDom(ctx);
      const findings: AuditFinding[] = [];

      const missingAlt = dom.images.filter((img) => !img.alt || !img.alt.trim()).length;
      if (missingAlt > 0) {
        findings.push({
          moduleId: "assets",
          category: "ACCESSIBILITY",
          severity: "MINOR",
          title: `${missingAlt} image(s) without alt text`,
          description: "Images on the target page are missing accessible names.",
          recommendation: "Provide meaningful alt attributes (or empty alt for decorative images).",
          metadata: { missingAlt },
        });
      }

      if (dom.scripts.length > 25) {
        findings.push({
          moduleId: "assets",
          category: "PERFORMANCE",
          severity: "INFO",
          title: "High number of script tags",
          description: `Found ${dom.scripts.length} external scripts on the target page.`,
          recommendation: "Bundle and defer non-critical scripts where possible.",
          metadata: { scriptCount: dom.scripts.length },
        });
      }

      if (dom.stylesheets.length > 15) {
        findings.push({
          moduleId: "assets",
          category: "PERFORMANCE",
          severity: "INFO",
          title: "Many stylesheet requests",
          description: `Found ${dom.stylesheets.length} stylesheets.`,
          recommendation: "Consolidate CSS to reduce request waterfalls.",
          metadata: { stylesheetCount: dom.stylesheets.length },
        });
      }

      return moduleOk("assets", started, scoreFromFindings(findings), findings, {
        images: dom.images.length,
        scripts: dom.scripts.length,
        stylesheets: dom.stylesheets.length,
      });
    } catch (error) {
      return moduleFail("assets", started, error);
    }
  },
};
