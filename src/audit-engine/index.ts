import {
  assertScanRunnable,
  updateScanProgress,
} from "@/lib/scanner/audit-scan-control";
import { AuditCancelledError } from "@/lib/scanner/audit-cancelled-error";
import { normalizeWebsiteHost } from "@/lib/website-host";
import {
  collectSiteProbe,
  collectTargetResponse,
  parseDomArtifact,
} from "./collect";
import { resolveAuditProfile } from "./profiles";
import { getHttpModules } from "./modules/registry";
import { runLabBundle } from "./lab/run-lab";
import { aggregateAuditResults } from "./aggregate";
import type {
  AuditEngineResult,
  AuditModule,
  AuditProfileId,
  ScanContext,
} from "./core/types";
import { ENGINE_PHASE_TO_AUDIT } from "./core/phase-map";
import type { EngineProgressKey } from "./core/progress";

export interface RunAuditEngineOptions {
  auditId: string;
  websiteId: string;
  targetUrl: string;
  profile?: AuditProfileId;
}

async function report(
  auditId: string,
  key: EngineProgressKey,
  message: string,
  host?: string
) {
  const def = ENGINE_PHASE_TO_AUDIT[key];
  await updateScanProgress(auditId, def.phase, {
    host,
    url: host,
    substep: message,
  });
  const { prisma } = await import("@/lib/prisma");
  await prisma.scan.updateMany({
    where: { id: auditId, status: "RUNNING" },
    data: {
      progressPercent: def.progress,
      statusMessage: message,
    },
  });
}

/**
 * V1 Target URL Audit Scan Engine.
 * No crawling / UrlFrontier / BFS. Broken Links is a separate product.
 */
export async function runAuditEngine(
  options: RunAuditEngineOptions
): Promise<AuditEngineResult> {
  const targetUrl = options.targetUrl.startsWith("http")
    ? options.targetUrl
    : `https://${options.targetUrl}`;
  const host = normalizeWebsiteHost(targetUrl) ?? targetUrl;
  const profile = resolveAuditProfile(options.profile);

  console.log(`[audit-engine] Starting ${profile.id} audit for ${targetUrl}`);

  await assertScanRunnable(options.auditId);
  await report(
    options.auditId,
    "initializing",
    `Preparing premium audit for ${host}…`,
    host
  );

  const ctx: ScanContext = {
    meta: {
      auditId: options.auditId,
      websiteId: options.websiteId,
      targetUrl,
      host,
      profile: profile.id,
      enableLab: profile.enableLab,
      lighthousePreset: profile.lighthousePreset,
    },
    response: null,
    dom: null,
    siteProbe: null,
    lab: null,
    modules: [],
  };

  // ── Collect once ──────────────────────────────────────────
  await assertScanRunnable(options.auditId);
  await report(
    options.auditId,
    "collecting",
    `Fetching ${host} and reading page structure…`,
    host
  );

  try {
    const [response, siteProbe] = await Promise.all([
      collectTargetResponse(targetUrl),
      collectSiteProbe(targetUrl),
    ]);
    ctx.response = response;
    ctx.siteProbe = siteProbe;

    if (!response.body) {
      throw new Error(
        `Target did not return HTML (HTTP ${response.status}${
          response.contentType ? `, ${response.contentType}` : ""
        }).`
      );
    }

    ctx.dom = parseDomArtifact(response.body, response.finalUrl || targetUrl);
  } catch (error) {
    if (error instanceof AuditCancelledError) throw error;
    throw new Error(
      `Could not collect target URL: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }

  // Drop raw HTML from memory after DomArtifact built (keep length hint only)
  if (ctx.dom) {
    ctx.dom = { ...ctx.dom, rawHtml: ctx.dom.rawHtml.slice(0, 120_000) };
  }

  // ── HTTP modules in parallel ──────────────────────────────
  await assertScanRunnable(options.auditId);
  await report(
    options.auditId,
    "analyzing",
    "Running SEO, security, HTML, technology & more…",
    host
  );

  const httpModules = getHttpModules(profile.httpModuleIds);
  const httpResults = await Promise.all(
    httpModules.map(async (mod: AuditModule) => {
      await assertScanRunnable(options.auditId);
      return mod.run(ctx);
    })
  );
  ctx.modules.push(...httpResults);

  // ── Lab (single Chrome) ───────────────────────────────────
  if (profile.enableLab) {
    await assertScanRunnable(options.auditId);
    await report(
      options.auditId,
      "lab_launch",
      "Opening lab browser for Lighthouse & accessibility…",
      host
    );

    await report(
      options.auditId,
      "performance",
      profile.lighthousePreset === "accurate"
        ? "Measuring Core Web Vitals (accurate mobile lab)…"
        : "Measuring Core Web Vitals with Lighthouse…",
      host
    );

    const lab = await runLabBundle(
      {
        auditId: options.auditId,
        targetUrl,
        lighthousePreset: profile.lighthousePreset,
        onSubstep: async (message) => {
          await report(options.auditId, "performance", message, host);
        },
      },
      { runAxe: profile.labModuleIds.includes("accessibility-axe") }
    );

    ctx.lab = lab.lab;
    ctx.modules.push(lab.performance);

    if (lab.accessibility) {
      await report(
        options.auditId,
        "accessibility",
        "Accessibility lab scan complete — merging findings…",
        host
      );
      ctx.modules.push(lab.accessibility);
    }
  }

  // ── Aggregate ─────────────────────────────────────────────
  await assertScanRunnable(options.auditId);
  await report(
    options.auditId,
    "finalizing",
    "Building your audit report and saving findings…",
    host
  );

  const result = aggregateAuditResults(ctx);
  console.log(
    `[audit-engine] Completed overall=${result.overallScore} modules=${ctx.modules.length}`
  );
  return result;
}
