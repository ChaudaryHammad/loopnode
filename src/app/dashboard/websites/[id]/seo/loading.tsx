import { AuditPageLoader } from "@/components/websites/audit-page-loader";
import { SeoSnapshotSkeleton } from "@/components/layout/page-loaders";

export default function SeoLoading() {
  return <AuditPageLoader categoryLabel="SEO" insightSkeleton={<SeoSnapshotSkeleton />} />;
}
