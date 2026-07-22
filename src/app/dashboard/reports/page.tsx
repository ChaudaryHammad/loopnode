import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveReportUrls } from "@/lib/cloudinary";
import { getEntitlements } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { ReportsClient } from "@/components/reports/reports-client";

export const metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [reports, websites, entitlements] = await Promise.all([
    prisma.report.findMany({
      where: { website: { userId: session.user.id, deletedAt: null } },
      include: { website: { select: { id: true, name: true, url: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.website.findMany({
      where: { userId: session.user.id, deletedAt: null },
      select: { id: true, name: true, url: true },
      orderBy: { name: "asc" },
    }),
    getEntitlements(session.user.id),
  ]);

  return (
    <ReportsClient
      canGenerateReports={entitlements.canGenerateReports}
      websites={websites}
      reports={reports.map((report) => {
        const { previewUrl, downloadUrl } = resolveReportUrls({ id: report.id });

        return {
          id: report.id,
          title: report.title,
          type: report.type,
          format: report.format,
          previewUrl,
          downloadUrl,
          fileSize: report.fileSize,
          scanId: report.scanId,
          websiteId: report.websiteId,
          websiteName: report.website.name,
          createdAt: report.createdAt.toISOString(),
          shareEnabled: report.shareEnabled,
          shareToken: report.shareToken,
          scanCompletedAt: report.scanCompletedAt?.toISOString() ?? null,
        };
      })}
    />
  );
}
