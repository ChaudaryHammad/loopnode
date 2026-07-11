import { getAdminCommandCenter } from "@/lib/admin-data";
import { AdminCommandCenter } from "@/components/admin/admin-command-center";

export const metadata = {
  title: "Admin Command Center",
};

export default async function AdminOverviewPage() {
  const data = await getAdminCommandCenter();

  return <AdminCommandCenter data={data} />;
}
