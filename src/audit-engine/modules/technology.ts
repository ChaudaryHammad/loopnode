import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireDom, requireResponse, scoreFromFindings } from "./_helpers";

export const technologyModule: AuditModule = {
  id: "technology",
  label: "Technology",
  async run(ctx) {
    const started = Date.now();
    try {
      const dom = requireDom(ctx);
      const response = requireResponse(ctx);
      const findings: AuditFinding[] = [];
      const tech: string[] = [];

      const server = response.headers["server"];
      const powered = response.headers["x-powered-by"];
      const generator = dom.rawHtml.match(
        /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i
      )?.[1];

      if (server) tech.push(`server:${server}`);
      if (powered) tech.push(`powered-by:${powered}`);
      if (generator) tech.push(`generator:${generator}`);

      if (/wp-content|wordpress/i.test(dom.rawHtml)) tech.push("WordPress");
      if (/__NEXT_DATA__|\/_next\//i.test(dom.rawHtml)) tech.push("Next.js");
      if (/cdn\.shopify\.com|Shopify\.theme/i.test(dom.rawHtml)) tech.push("Shopify");
      if (/cloudflare/i.test(server ?? "") || response.headers["cf-ray"]) tech.push("Cloudflare");
      if (/react/i.test(dom.rawHtml) && /data-reactroot|__REACT/i.test(dom.rawHtml)) {
        tech.push("React");
      }

      if (powered) {
        findings.push({
          moduleId: "technology",
          category: "SECURITY",
          severity: "INFO",
          title: "X-Powered-By header exposes stack details",
          description: `Server advertises: ${powered}`,
          recommendation: "Remove X-Powered-By in production responses.",
          metadata: { powered },
        });
      }

      return moduleOk("technology", started, scoreFromFindings(findings), findings, {
        technologies: tech.join(", ") || "unknown",
      });
    } catch (error) {
      return moduleFail("technology", started, error);
    }
  },
};
