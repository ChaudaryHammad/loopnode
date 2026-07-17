import { prisma } from "@/lib/prisma";
import {
  categoryToAuditPath,
  computeIssueFingerprint,
  sortIssuesBySeverity,
} from "@/lib/issues";
import type { IssueCategory, IssueSeverity, IssueStatus } from "@prisma/client";
import type { ScanIssueInput } from "@/lib/scanner/types";

export type PortfolioIssue = {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  description: string;
  selector: string | null;
  url: string | null;
  recommendation: string | null;
  metadata: unknown;
  fingerprint: string;
  acknowledgedAt: Date | null;
  createdAt: Date;
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  scanId: string;
  scanCompletedAt: Date | null;
  auditPath: string;
};

export async function getPortfolioIssuesForUser(userId: string) {
  const websites = await prisma.website.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, name: true, url: true },
    orderBy: { name: "asc" },
  });

  if (websites.length === 0) {
    return { websites: [], issues: [] as PortfolioIssue[] };
  }

  const latestScans = await Promise.all(
    websites.map((website) =>
      prisma.scan.findFirst({
        where: { websiteId: website.id, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          completedAt: true,
          issues: {
            select: {
              id: true,
              category: true,
              severity: true,
              status: true,
              title: true,
              description: true,
              selector: true,
              url: true,
              recommendation: true,
              metadata: true,
              fingerprint: true,
              acknowledgedAt: true,
              createdAt: true,
            },
          },
        },
      })
    )
  );

  const issues: PortfolioIssue[] = [];

  websites.forEach((website, index) => {
    const scan = latestScans[index];
    if (!scan) return;

    for (const issue of scan.issues) {
      if (issue.status === "RESOLVED") continue;

      issues.push({
        ...issue,
        websiteId: website.id,
        websiteName: website.name,
        websiteUrl: website.url,
        scanId: scan.id,
        scanCompletedAt: scan.completedAt,
        auditPath: categoryToAuditPath(website.id, issue.category),
      });
    }
  });

  return {
    websites,
    issues: sortIssuesBySeverity(issues),
  };
}

export async function autoResolveIssuesAfterAudit(
  websiteId: string,
  currentScanId: string,
  newIssues: ScanIssueInput[]
) {
  const newFingerprints = new Set(newIssues.map((issue) => computeIssueFingerprint(issue)));

  const staleIssues = await prisma.issue.findMany({
    where: {
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
      scan: {
        websiteId,
        status: "COMPLETED",
        id: { not: currentScanId },
      },
    },
    select: {
      id: true,
      fingerprint: true,
      category: true,
      title: true,
      selector: true,
      url: true,
    },
  });

  const idsToResolve = staleIssues
    .filter((issue) => {
      const fingerprint =
        issue.fingerprint ||
        computeIssueFingerprint({
          category: issue.category,
          title: issue.title,
          selector: issue.selector,
          url: issue.url,
        });
      return !newFingerprints.has(fingerprint);
    })
    .map((issue) => issue.id);

  if (idsToResolve.length === 0) return 0;

  await prisma.issue.updateMany({
    where: { id: { in: idsToResolve } },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  return idsToResolve.length;
}

export async function assertIssueOwnership(issueId: string, userId: string) {
  return prisma.issue.findFirst({
    where: {
      id: issueId,
      scan: {
        website: { userId, deletedAt: null },
      },
    },
    select: { id: true, status: true, title: true, scanId: true },
  });
}

export async function deleteIssuesForUser(userId: string, issueIds: string[]) {
  if (issueIds.length === 0) return [];

  const owned = await prisma.issue.findMany({
    where: {
      id: { in: issueIds },
      scan: { website: { userId, deletedAt: null } },
    },
    select: { id: true, title: true, scanId: true },
  });

  if (owned.length === 0) return [];

  const ownedIds = owned.map((i) => i.id);

  await prisma.issue.deleteMany({
    where: { id: { in: ownedIds } },
  });

  await prisma.activityLog.createMany({
    data: owned.map((issue) => ({
      userId,
      action: "ISSUE_DISMISSED",
      description: `Dismissed issue "${issue.title}"`,
      metadata: { issueId: issue.id, scanId: issue.scanId },
    })),
  });

  return ownedIds;
}
