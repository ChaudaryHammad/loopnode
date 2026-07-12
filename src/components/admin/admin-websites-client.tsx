"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, ExternalLink, Play, RotateCcw, Search } from "lucide-react";
import { adminForceScanAction, setWebsiteDisabledAction } from "@/actions/admin";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SerializedWebsite = {
  id: string;
  name: string;
  url: string;
  deletedAt: string | null;
  createdAt: string;
  ownerEmail: string;
  ownerName: string | null;
  ownerBanned: boolean;
  scanCount: number;
  latestScan: {
    status: string;
    overallScore: number | null;
    createdAt: string;
  } | null;
};

const PAGE_SIZE = 20;

export function AdminWebsitesClient({ websites }: { websites: SerializedWebsite[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return websites;
    return websites.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.url.toLowerCase().includes(q) ||
        w.ownerEmail.toLowerCase().includes(q)
    );
  }, [websites, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const runAction = (fn: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      toast.fromAction(res, { success: "Updated.", error: "Action failed." });
      if (res.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/20 pb-6 space-y-1">
        <p className="text-sm text-muted-foreground">
          Cross-tenant website list — force audits or disable sites.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search site, URL, or owner…"
          className="pl-9"
        />
      </div>

      <Card className="rounded-2xl border-border/30 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Website</TableHead>
                <TableHead className="hidden md:table-cell">Owner</TableHead>
                <TableHead className="hidden lg:table-cell">Latest scan</TableHead>
                <TableHead className="hidden sm:table-cell">Scans</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((site) => {
                const disabled = Boolean(site.deletedAt);
                return (
                  <TableRow key={site.id} className={disabled ? "opacity-60" : undefined}>
                    <TableCell>
                      <p className="font-medium text-sm">{site.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{site.url}</p>
                      {disabled && (
                        <Badge variant="destructive" className="mt-1 text-[10px]">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      <p>{site.ownerName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{site.ownerEmail}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {site.latestScan ? (
                        <>
                          <Badge variant="outline" className="text-[10px]">
                            {site.latestScan.status}
                          </Badge>
                          {site.latestScan.overallScore != null && (
                            <span className="ml-1 tabular-nums">
                              {Math.round(site.latestScan.overallScore)}
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell tabular-nums">
                      {site.scanCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Open website"
                          render={<a href={site.url} target="_blank" rel="noopener noreferrer" />}
                          nativeButton={false}
                        >
                          <ExternalLink />
                        </Button>
                        {!disabled && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Force audit scan"
                            disabled={isPending}
                            onClick={() => runAction(() => adminForceScanAction(site.id))}
                          >
                            <Play />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={disabled ? "Re-enable" : "Disable"}
                          disabled={isPending}
                          className={disabled ? undefined : "text-rose-500 hover:text-rose-500"}
                          onClick={() => runAction(() => setWebsiteDisabledAction(site.id, !disabled))}
                        >
                          {disabled ? <RotateCcw /> : <Ban />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
