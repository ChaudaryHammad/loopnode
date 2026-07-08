import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireDom, scoreFromFindings } from "./_helpers";

export const htmlValidationModule: AuditModule = {
  id: "html-validation",
  label: "HTML Validation",
  async run(ctx) {
    const started = Date.now();
    try {
      const dom = requireDom(ctx);
      const findings: AuditFinding[] = [];

      if (!dom.doctypePresent) {
        findings.push({
          moduleId: "html-validation",
          category: "SEO",
          severity: "MINOR",
          title: "Missing HTML doctype",
          description: "Document does not start with <!DOCTYPE html>.",
          recommendation: "Add <!DOCTYPE html> as the first line.",
        });
      }

      if (!dom.htmlLang) {
        findings.push({
          moduleId: "html-validation",
          category: "ACCESSIBILITY",
          severity: "MAJOR",
          title: "Missing html lang attribute",
          description: "Assistive tech needs lang to pronounce content correctly.",
          recommendation: 'Add lang="en" (or your language) on the <html> element.',
        });
      }

      if (!dom.rawHtml.includes("</html>") || !dom.rawHtml.includes("</body>")) {
        findings.push({
          moduleId: "html-validation",
          category: "SEO",
          severity: "INFO",
          title: "Possible truncated HTML document",
          description: "Closing </body> or </html> tags were not detected.",
          recommendation: "Ensure the server returns a complete HTML document.",
        });
      }

      return moduleOk("html-validation", started, scoreFromFindings(findings), findings);
    } catch (error) {
      return moduleFail("html-validation", started, error);
    }
  },
};
