import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireDom, scoreFromFindings } from "./_helpers";

export const structuredDataModule: AuditModule = {
  id: "structured-data",
  label: "Structured Data",
  async run(ctx) {
    const started = Date.now();
    try {
      const dom = requireDom(ctx);
      const findings: AuditFinding[] = [];

      if (dom.jsonLdBlocks.length === 0) {
        findings.push({
          moduleId: "structured-data",
          category: "SEO",
          severity: "INFO",
          title: "No JSON-LD structured data found",
          description: "Structured data can improve rich results in search engines.",
          recommendation: "Add relevant schema.org JSON-LD for Organization, WebSite, or Article.",
        });
      } else {
        for (const [index, block] of dom.jsonLdBlocks.entries()) {
          try {
            JSON.parse(block);
          } catch {
            findings.push({
              moduleId: "structured-data",
              category: "SEO",
              severity: "MAJOR",
              title: "Invalid JSON-LD block",
              description: `JSON-LD script #${index + 1} is not valid JSON.`,
              recommendation: "Fix JSON syntax in the application/ld+json script.",
            });
          }
        }
      }

      return moduleOk("structured-data", started, scoreFromFindings(findings), findings, {
        jsonLdCount: dom.jsonLdBlocks.length,
      });
    } catch (error) {
      return moduleFail("structured-data", started, error);
    }
  },
};
