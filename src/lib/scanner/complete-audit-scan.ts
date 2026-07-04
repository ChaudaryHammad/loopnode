import { prisma } from "@/lib/prisma";
import {
  assertScanRunnable,
  updateScanProgress,
} from "./audit-scan-control";
import { AuditCancelledError } from "./audit-cancelled-error";
import { autoResolveIssuesAfterAudit } from "@/lib/issue-service";
import { computeIssueFingerprint } from "@/lib/issues";

export async function completeAuditScan(
  scanId: string,
  website: { id: string; name: string; url: string; userId: string }
) {
  await assertScanRunnable(scanId);
  await updateScanProgress(scanId, "queued", { url: website.url });

  const { runFullAudit } = await import("./audit-runner");

  let result;
  try {
    result = await runFullAudit(website.url, { scanId });
  } catch (error) {
    if (error instanceof AuditCancelledError) {
      throw error;
    }
    throw error;
  }

  await assertScanRunnable(scanId);

  const completedScan = await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: "COMPLETED",
      phase: "completed",
      statusMessage: "Audit complete — results are ready.",
      progressPercent: 100,
      overallScore: result.overallScore,
      performanceScore: result.performanceScore,
      accessibilityScore: result.accessibilityScore,
      seoScore: result.seoScore,
      securityScore: result.securityScore,
      fcp: result.fcp,
      lcp: result.lcp,
      cls: result.cls,
      inp: result.inp,
      tbt: result.tbt,
      completedAt: new Date(),
      issues: {
        create: result.issues.map((issue) => ({
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          selector: issue.selector ?? null,
          url: issue.url ?? null,
          recommendation: issue.recommendation ?? null,
          fingerprint: computeIssueFingerprint(issue),
          status: "OPEN" as const,
          metadata: issue.metadata ? JSON.parse(JSON.stringify(issue.metadata)) : undefined,
        })),
      },
    },
  });

  await autoResolveIssuesAfterAudit(website.id, completedScan.id, result.issues);

  await prisma.activityLog.create({
    data: {
      userId: website.userId,
      action: "SCAN_COMPLETED",
      description: `Completed audit for "${website.name}" — overall score: ${result.overallScore}`,
      metadata: { websiteId: website.id, scanId, overallScore: result.overallScore },
    },
  });

  return completedScan;
}
