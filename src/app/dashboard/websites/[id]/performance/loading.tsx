import { AuditPageLoader } from "@/components/websites/audit-page-loader";
import { PerformanceInsightSkeleton } from "@/components/layout/page-loaders";

export default function PerformanceLoading() {
  return (
    <AuditPageLoader
      categoryLabel="Performance"
      insightSkeleton={<PerformanceInsightSkeleton />}
    />
  );
}
