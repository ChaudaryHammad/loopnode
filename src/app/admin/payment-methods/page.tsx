import { getAdminPaymentMethods } from "@/lib/payment-methods";
import { AdminPaymentMethodsClient } from "@/components/admin/admin-payment-methods-client";

export const metadata = {
  title: "Payment Methods",
};

export default async function AdminPaymentMethodsPage() {
  const methods = await getAdminPaymentMethods();

  return (
    <AdminPaymentMethodsClient
      methods={methods.map((m) => ({
        id: m.id,
        label: m.label,
        tagline: m.tagline,
        displayStyle: m.displayStyle,
        details: m.details,
        enabled: m.enabled,
        sortOrder: m.sortOrder,
      }))}
    />
  );
}
