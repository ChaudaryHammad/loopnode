"use server";

import { auth } from "@/lib/auth";
import { resolveReportUrls } from "@/lib/cloudinary";
import { getEntitlements } from "@/lib/entitlements";
import {
  deleteReportForUser,
  generateReportForUser,
  getCompletedScansForWebsite,
  getReportsForUser,
  setReportShareForUser,
} from "@/lib/report-service";
import { getReportShareUrl } from "@/lib/reports/share";
import { generateReportSchema } from "@/lib/validations/reports";
import { revalidatePath } from "next/cache";

export async function getReportsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized." };
  }

  try {
    const reports = await getReportsForUser(session.user.id);
    return { success: true as const, data: reports };
  } catch (error) {
    console.error("Get reports error:", error);
    return { success: false as const, error: "Failed to load reports." };
  }
}

export async function getWebsiteScansForReportsAction(websiteId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized." };
  }

  try {
    const scans = await getCompletedScansForWebsite(session.user.id, websiteId);
    return { success: true as const, data: scans };
  } catch (error) {
    console.error("Get website scans error:", error);
    return { success: false as const, error: "Failed to load scans." };
  }
}

export async function generateReportAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.canGenerateReports) {
    return {
      success: false,
      error: "Report generation requires a Pro or Agency plan. Upgrade in Billing settings.",
    };
  }

  const parsed = generateReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid report options.",
    };
  }

  try {
    const result = await generateReportForUser(session.user.id, parsed.data);

    if (!result.saved) {
      return {
        success: true,
        message: "Report downloaded.",
        data: {
          saved: false as const,
          title: result.title,
          format: result.format,
          fileSize: result.fileSize,
          fileBase64: result.fileBase64,
          websiteId: result.websiteId,
          websiteName: result.websiteName,
          scanId: result.scanId,
          type: result.type,
        },
      };
    }

    revalidatePath("/dashboard/reports");
    const { previewUrl, downloadUrl } = resolveReportUrls({ id: result.report.id });

    return {
      success: true,
      message: "Report saved to your library.",
      data: {
        saved: true as const,
        id: result.report.id,
        title: result.report.title,
        previewUrl,
        downloadUrl,
        format: result.report.format,
        fileSize: result.report.fileSize,
        type: result.report.type,
        websiteId: result.report.websiteId,
        websiteName: result.report.website.name,
        scanId: result.report.scanId,
        createdAt: result.report.createdAt.toISOString(),
        shareEnabled: result.report.shareEnabled,
        shareToken: result.report.shareToken,
        scanCompletedAt: result.report.scanCompletedAt?.toISOString() ?? null,
      },
    };
  } catch (error) {
    console.error("Generate report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate report.",
    };
  }
}

export async function deleteReportAction(reportId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const deleted = await deleteReportForUser(session.user.id, reportId);
    if (!deleted) {
      return { success: false, error: "Report not found." };
    }

    revalidatePath("/dashboard/reports");
    return { success: true, message: "Report deleted." };
  } catch (error) {
    console.error("Delete report error:", error);
    return { success: false, error: "Failed to delete report." };
  }
}

export async function setReportShareAction(reportId: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized." };
  }

  try {
    const report = await setReportShareForUser(session.user.id, reportId, enabled);
    if (!report) {
      return { success: false as const, error: "Report not found." };
    }

    revalidatePath("/dashboard/reports");

    return {
      success: true as const,
      message: enabled ? "Share link enabled." : "Share link disabled.",
      data: {
        shareEnabled: report.shareEnabled,
        shareToken: report.shareToken,
        shareUrl: report.shareToken ? getReportShareUrl(report.shareToken) : null,
      },
    };
  } catch (error) {
    console.error("Set report share error:", error);
    return { success: false as const, error: "Failed to update sharing." };
  }
}
