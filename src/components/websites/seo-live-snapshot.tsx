import { fetchSeoSnapshot } from "@/lib/seo/fetch-seo-snapshot";
import { SeoSnapshotPanel } from "./seo-snapshot-panel";

export async function SeoLiveSnapshot({ url }: { url: string }) {
  const snapshot = await fetchSeoSnapshot(url);
  return <SeoSnapshotPanel snapshot={snapshot} />;
}
