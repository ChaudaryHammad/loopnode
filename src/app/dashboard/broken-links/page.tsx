import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BrokenLinksHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      url: true,
      brokenLinkScans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          brokenCount: true,
          linksChecked: true,
          completedAt: true,
          mode: true,
        },
      },
    },
  });

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Crawl summaries across your sites. Open a site to run a new internal or external link
          check.
        </p>
      </div>

      {websites.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card p-10 text-center">
          <Link2 className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">No websites yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Connect a website to start checking for broken links.
          </p>
          <Button render={<Link href="/dashboard/websites" />} nativeButton={false}>
            Go to websites
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Last scan</th>
                  <th className="px-4 py-3 font-medium">Broken</th>
                  <th className="px-4 py-3 font-medium">Checked</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {websites.map((w) => {
                  const scan = w.brokenLinkScans[0];
                  return (
                    <tr key={w.id} className="border-b border-border/30 hover:bg-secondary/10">
                      <td className="px-4 py-3">
                        <div className="font-medium">{w.name}</div>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {w.url.replace(/^https?:\/\//, "")}
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {scan ? (
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {scan.status.toLowerCase()}
                            {scan.mode ? ` · ${scan.mode.toLowerCase()}` : ""}
                          </Badge>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {scan ? (
                          <span className={scan.brokenCount > 0 ? "text-rose-400" : "text-emerald-400"}>
                            {scan.brokenCount}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {scan?.linksChecked ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/dashboard/websites/${w.id}/broken-links`} />}
                          nativeButton={false}
                        >
                          Open
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
