import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireDom, scoreFromFindings } from "./_helpers";

export const accessibilityStaticModule: AuditModule = {
  id: "accessibility-static",
  label: "Accessibility (static)",
  async run(ctx) {
    const started = Date.now();
    try {
      const dom = requireDom(ctx);
      const findings: AuditFinding[] = [];

      if (!dom.htmlLang) {
        findings.push({
          moduleId: "accessibility-static",
          category: "ACCESSIBILITY",
          severity: "MAJOR",
          title: "Document language not set",
          description: "The <html> element is missing a lang attribute.",
          recommendation: "Set lang to the primary language of the page.",
        });
      }

      const emptyLinks = dom.links.filter((l) => !l.text.trim() && !l.href.startsWith("#"));
      if (emptyLinks.length > 0) {
        findings.push({
          moduleId: "accessibility-static",
          category: "ACCESSIBILITY",
          severity: "MINOR",
          title: "Links without accessible text",
          description: `Found ${emptyLinks.length} anchor(s) with empty link text.`,
          recommendation: "Provide visible text or aria-label for every link.",
        });
      }

      return moduleOk("accessibility-static", started, scoreFromFindings(findings), findings);
    } catch (error) {
      return moduleFail("accessibility-static", started, error);
    }
  },
};
