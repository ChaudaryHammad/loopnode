import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import type { AuditIssue } from "@/components/websites/audit-shared";
import type { IssueCategory } from "@prisma/client";

export async function requireAuditSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  return { session, userId };
}

export async function getOwnedWebsite(websiteId: string, userId: string) {
  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId, deletedAt: null },
    select: { id: true, name: true, url: true },
  });
  if (!website) notFound();
  return website;
}

export async function getAuditPageWebsite(websiteId: string) {
  const { session, userId } = await requireAuditSession();
  const website = await getOwnedWebsite(websiteId, userId);
  return { session, website };
}

export async function generateAuditPageMetadata(websiteId: string, categoryLabel: string) {
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { name: true },
  });
  return { title: `${website?.name ?? "Website"} — ${categoryLabel} Audit` };
}

type ScanIssueRow = {
  id: string;
  severity: string;
  title: string;
  description: string;
  selector: string | null;
  url: string | null;
  recommendation: string | null;
  metadata?: unknown;
};

export function mapScanIssuesToAuditIssues(issues: ScanIssueRow[]): AuditIssue[] {
  return issues.map((issue) => ({
    id: issue.id,
    severity: issue.severity as AuditIssue["severity"],
    title: issue.title,
    description: issue.description,
    selector: issue.selector,
    url: issue.url,
    recommendation: issue.recommendation,
    metadata: issue.metadata ?? null,
  }));
}

export async function getLatestCompletedScanWithIssues(
  websiteId: string,
  category: IssueCategory
) {
  return prisma.scan.findFirst({
    where: { websiteId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: {
      issues: {
        where: { category },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      },
    },
  });
}
