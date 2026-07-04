import { getAdminUpgradeRequests } from "@/lib/admin-data";
import { AdminUpgradeRequestsClient } from "@/components/admin/admin-upgrade-requests-client";

export const metadata = { title: "Admin — Upgrade requests" };

export default async function AdminUpgradeRequestsPage() {
  const requests = await getAdminUpgradeRequests();

  return (
    <AdminUpgradeRequestsClient
      requests={requests.map((r) => ({
        id: r.id,
        requestedPlan: r.requestedPlan,
        paymentMethodLabel: r.paymentMethodLabel ?? r.paymentMethodConfig?.label ?? r.paymentMethod,
        paymentReference: r.paymentReference,
        paymentProofUrl: r.paymentProofUrl,
        userNote: r.userNote,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
        user: {
          id: r.user.id,
          name: r.user.name,
          email: r.user.email,
          subscription: r.user.subscription,
          _count: r.user._count,
        },
      }))}
    />
  );
}
