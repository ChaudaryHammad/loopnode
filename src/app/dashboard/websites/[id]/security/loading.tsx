import { AuditPageLoader } from "@/components/websites/audit-page-loader";
import { SecurityHeadersSkeleton } from "@/components/layout/page-loaders";

export default function SecurityLoading() {
  return (
    <AuditPageLoader categoryLabel="Security" insightSkeleton={<SecurityHeadersSkeleton />} />
  );
}
