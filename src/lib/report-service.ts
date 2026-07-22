import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import {
  cleanCloudinaryUrl,
  deleteReportFile,
  getReportPublicId,
  uploadReportFile,
} from "@/lib/cloudinary";
import { generateIssuesCsv } from "@/lib/reports/generate-csv";
import { generateReportPdf } from "@/lib/reports/generate-pdf";
import {
  buildReportTitle,
  type ReportScanContext,
  type ScanWithIssues,
} from "@/lib/reports/types";
import { createShareToken } from "@/lib/reports/share";
import type { ReportType } from "@prisma/client";

const scanWithIssuesInclude = {
  issues: {
    orderBy: [{ severity: "asc" as const }, { category: "asc" as const }],
  },
};

export async function getReportsForUser(userId: string) {
  return prisma.report.findMany({
    where: {
      website: { userId, deletedAt: null },
    },
    include: {
      website: { select: { id: true, name: true, url: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompletedScansForWebsite(userId: string, websiteId: string) {
  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId, deletedAt: null },
    select: { id: true },
  });

  if (!website) return [];

  return prisma.scan.findMany({
    where: { websiteId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      completedAt: true,
      overallScore: true,
      createdAt: true,
    },
    take: 50,
  });
}

async function loadScanContext(
  userId: string,
  websiteId: string,
  scanId: string
): Promise<ReportScanContext | null> {
  const website = await prisma.website.findFirst({
    where: { id: websiteId, userId, deletedAt: null },
    select: { id: true, name: true, url: true },
  });

  if (!website) return null;

  const scan = await prisma.scan.findFirst({
    where: {
      id: scanId,
      websiteId,
      status: "COMPLETED",
    },
    include: scanWithIssuesInclude,
  });

  if (!scan) return null;

  const previousScan = await prisma.scan.findFirst({
    where: {
      websiteId,
      status: "COMPLETED",
      id: { not: scan.id },
      ...(scan.completedAt
        ? { completedAt: { lt: scan.completedAt } }
        : { createdAt: { lt: scan.createdAt } }),
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    include: scanWithIssuesInclude,
  });

  return {
    website,
    scan: scan as ScanWithIssues,
    previousScan: (previousScan as ScanWithIssues | null) ?? null,
  };
}

export async function generateReportForUser(
  userId: string,
  input: {
    websiteId: string;
    scanId: string;
    type: ReportType;
    customTitle?: string;
    saveToLibrary?: boolean;
  }
) {
  const entitlements = await getEntitlements(userId);
  if (!entitlements.canGenerateReports) {
    throw new Error(
      "Report generation requires a Pro or Agency plan. Upgrade in Billing settings."
    );
  }

  const context = await loadScanContext(userId, input.websiteId, input.scanId);
  if (!context) {
    throw new Error("Scan not found or not accessible.");
  }

  const title =
    input.customTitle?.trim() ||
    buildReportTitle(input.type, context.website.name, context.scan.completedAt);

  let buffer: Buffer;
  let format: "pdf" | "csv";

  switch (input.type) {
    case "FULL_AUDIT":
    case "EXECUTIVE_SUMMARY":
    case "PERFORMANCE_REPORT":
    case "SEO_REPORT":
    case "SECURITY_REPORT":
    case "ACCESSIBILITY_REPORT":
      buffer = await generateReportPdf(input.type, context);
      format = "pdf";
      break;
    case "ISSUES_CSV":
      buffer = generateIssuesCsv(
        context.website.name,
        context.website.url,
        context.scan.completedAt,
        context.scan.issues
      );
      format = "csv";
      break;
    default:
      throw new Error("Unsupported report type.");
  }

  const saveToLibrary = input.saveToLibrary !== false;

  if (!saveToLibrary) {
    return {
      saved: false as const,
      title,
      format,
      fileSize: buffer.byteLength,
      fileBase64: buffer.toString("base64"),
      websiteId: context.website.id,
      websiteName: context.website.name,
      scanId: context.scan.id,
      type: input.type,
    };
  }

  const reportId = crypto.randomUUID();
  const publicId = getReportPublicId(userId, reportId, format);
  const upload = await uploadReportFile(userId, reportId, buffer, format);
  const fileUrl = cleanCloudinaryUrl(upload.secure_url);

  const report = await prisma.report.create({
    data: {
      id: reportId,
      websiteId: context.website.id,
      scanId: context.scan.id,
      type: input.type,
      format,
      title,
      fileUrl,
      cloudinaryPublicId: publicId,
      fileSize: buffer.byteLength,
      shareToken: createShareToken(),
      shareEnabled: false,
      scanCompletedAt: context.scan.completedAt,
    },
    include: {
      website: { select: { id: true, name: true, url: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "REPORT_GENERATED",
      description: `Generated ${title}`,
      metadata: {
        reportId: report.id,
        websiteId: report.websiteId,
        scanId: report.scanId,
        type: report.type,
      },
    },
  });

  return {
    saved: true as const,
    report,
  };
}

export async function deleteReportForUser(userId: string, reportId: string) {
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      website: { userId, deletedAt: null },
    },
  });

  if (!report) return null;

  if (report.cloudinaryPublicId) {
    try {
      await deleteReportFile(
        report.cloudinaryPublicId,
        report.format === "csv" ? "csv" : "pdf"
      );
    } catch (error) {
      console.warn("Cloudinary report delete failed:", error);
    }
  }

  await prisma.report.delete({ where: { id: report.id } });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "REPORT_DELETED",
      description: `Deleted report "${report.title}"`,
      metadata: { reportId: report.id, websiteId: report.websiteId },
    },
  });

  return report;
}

export async function setReportShareForUser(
  userId: string,
  reportId: string,
  enabled: boolean
) {
  const report = await prisma.report.findFirst({
    where: {
      id: reportId,
      website: { userId, deletedAt: null },
    },
  });

  if (!report) return null;

  const shareToken = report.shareToken ?? createShareToken();

  return prisma.report.update({
    where: { id: report.id },
    data: {
      shareEnabled: enabled,
      shareToken,
    },
    include: {
      website: { select: { id: true, name: true, url: true } },
    },
  });
}

export async function getReportByShareToken(shareToken: string) {
  return prisma.report.findFirst({
    where: {
      shareToken,
      shareEnabled: true,
      format: "pdf",
    },
    include: {
      website: { select: { name: true, url: true } },
    },
  });
}
