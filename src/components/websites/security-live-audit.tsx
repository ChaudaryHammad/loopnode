import { fetchSecurityHeaderAudit } from "@/lib/security/fetch-security-headers";
import { SecurityLivePanel } from "./security-live-panel";

export async function SecurityLiveAudit({ url }: { url: string }) {
  const headerAudit = await fetchSecurityHeaderAudit(url);
  return <SecurityLivePanel headerAudit={headerAudit} />;
}
