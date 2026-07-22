import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBillingOverviewAction } from "@/actions/upgrade-requests";
import { BillingSettingsClient } from "@/components/settings/billing-settings-client";

export const metadata = {
  title: "Billing Settings",
};

export default async function SettingsBillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const result = await getBillingOverviewAction();
  if (!result.success || !result.data) {
    redirect("/login");
  }

  const { entitlements, requests, pendingRequest } = result.data;

  return (
    <BillingSettingsClient
      entitlements={{
        plan: entitlements.plan,
        planLabel: entitlements.planLabel,
        status: entitlements.status,
        websiteLimit: entitlements.websiteLimit,
        websiteCount: entitlements.websiteCount,
        websitesRemaining: entitlements.websitesRemaining,
        canAddWebsite: entitlements.canAddWebsite,
        canScheduleScans: entitlements.canScheduleScans,
        canGenerateReports: entitlements.canGenerateReports,
        isTrial: entitlements.isTrial,
        isReadOnly: entitlements.isReadOnly,
        trialEndsAt: entitlements.trialEndsAt?.toISOString() ?? null,
        accountMessage: entitlements.accountMessage,
      }}
      requests={requests.map((r) => ({
        id: r.id,
        requestedPlan: r.requestedPlan,
        paymentMethod: r.paymentMethodLabel ?? r.paymentMethod,
        paymentReference: r.paymentReference,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
        reviewedAt: r.reviewedAt?.toISOString() ?? null,
      }))}
      hasPendingRequest={!!pendingRequest}
    />
  );
}
