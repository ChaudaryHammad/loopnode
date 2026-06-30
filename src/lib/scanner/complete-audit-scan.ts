import { prisma } from "@/lib/prisma";
import { assertScanRunnable, isAuditScanCancelled } from "./audit-scan-control";
import { autoResolveIssuesAfterAudit } from "@/lib/issue-service";
import { computeIssueFingerprint } from "@/lib/issues";

export async function completeAuditScan(
  scanId: string,
  website: { id: string; name: string; url: string; userId: string },
  abortSignal?: AbortSignal
) {
  await assertScanRunnable(scanId);

  const shouldCancel = async () => {
    if (abortSignal?.aborted) return true;
    return isAuditScanCancelled(scanId);
  };

  const { runFullAudit } = await import("./audit-runner");
  const result = await runFullAudit(website.url, shouldCancel);

  await assertScanRunnable(scanId);

  const completedScan = await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: "COMPLETED",
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
