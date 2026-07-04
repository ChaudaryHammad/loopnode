import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBillingOverviewAction } from "@/actions/upgrade-requests";
import { getEnabledPaymentMethods } from "@/lib/payment-methods";
import { UpgradeRequestClient } from "@/components/settings/upgrade-request-client";

export const metadata = {
  title: "Upgrade Plan",
};

export default async function UpgradeRequestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [result, paymentMethods] = await Promise.all([
    getBillingOverviewAction(),
    getEnabledPaymentMethods(),
  ]);

  if (!result.success || !result.data) redirect("/login");

  const { entitlements, pendingRequest } = result.data;

  return (
    <UpgradeRequestClient
      hasPendingRequest={!!pendingRequest}
      currentPlanLabel={entitlements.planLabel}
      paymentMethods={paymentMethods}
    />
  );
}
