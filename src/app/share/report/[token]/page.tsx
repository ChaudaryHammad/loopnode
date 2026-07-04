import { notFound } from "next/navigation";
import { getReportByShareToken } from "@/lib/report-service";
import { REPORT_TYPE_LABELS } from "@/lib/reports/types";
import { formatDateTime } from "@/lib/utils";
import { ShareReportClient } from "@/components/reports/share-report-client";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const report = await getReportByShareToken(token);
  return {
    title: report ? report.title : "Shared report",
    robots: { index: false, follow: false },
  };
}

export default async function ShareReportPage({ params }: Props) {
  const { token } = await params;
  const report = await getReportByShareToken(token);
  if (!report) notFound();

  return (
    <ShareReportClient
      title={report.title}
      websiteName={report.website.name}
      websiteUrl={report.website.url}
      reportType={REPORT_TYPE_LABELS[report.type]}
      generatedAt={formatDateTime(report.createdAt)}
      scanDate={report.scanCompletedAt ? formatDateTime(report.scanCompletedAt) : null}
      fileUrl={`/api/share/report/${token}/file`}
      previewUrl={`/api/share/report/${token}/file?disposition=inline`}
    />
  );
}
