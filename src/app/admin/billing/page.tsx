import { getAdminSubscriptions } from "@/lib/admin-data";
import { PLAN_PRICES_USD } from "@/lib/plans";
import { AdminBillingClient } from "@/components/admin/admin-billing-client";

export const metadata = { title: "Admin — Billing" };

export default async function AdminBillingPage() {
  const { subscriptions, usersWithoutSubscription } = await getAdminSubscriptions();

  const estimatedMrr = subscriptions
    .filter((s) => s.status === "ACTIVE" && s.plan)
    .reduce((sum, s) => sum + PLAN_PRICES_USD[s.plan!], 0);

  return (
    <AdminBillingClient
      estimatedMrr={estimatedMrr}
      subscriptions={subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        userName: sub.user.name,
        userEmail: sub.user.email,
        userBanned: Boolean(sub.user.deletedAt),
        websiteCount: sub.user._count.websites,
        plan: sub.plan,
        status: sub.status,
        trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        websiteLimitOverride: sub.websiteLimitOverride,
        adminNotes: sub.adminNotes,
        updatedAt: sub.updatedAt.toISOString(),
      }))}
      usersWithoutSubscription={usersWithoutSubscription.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        websiteCount: user._count.websites,
        createdAt: user.createdAt.toISOString(),
      }))}
    />
  );
}
