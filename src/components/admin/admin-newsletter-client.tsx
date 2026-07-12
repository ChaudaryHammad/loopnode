"use client";

import React, { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { exportNewsletterCsvAction } from "@/actions/admin";
import { formatDateTime } from "@/lib/utils";
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

type Subscriber = {
  id: string;
  email: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

export function AdminNewsletterClient({ subscribers }: { subscribers: Subscriber[] }) {
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  const activeCount = subscribers.filter((s) => !s.unsubscribedAt).length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportNewsletterCsvAction();
      if (res.success && res.data) {
        const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = res.data.filename;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border/20 pb-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {activeCount} active · {subscribers.length} total records
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={exporting || activeCount === 0} onClick={handleExport}>
          <Download />
          Export active CSV
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email…"
          className="pl-9"
        />
      </div>

      <Card className="rounded-2xl border-border/30 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Subscribed</TableHead>
                <TableHead className="hidden md:table-cell">Unsubscribed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id} className={sub.unsubscribedAt ? "opacity-60" : undefined}>
                  <TableCell className="font-mono text-sm">{sub.email}</TableCell>
                  <TableCell>
                    <Badge variant={sub.unsubscribedAt ? "outline" : "secondary"} className="text-[10px]">
                      {sub.unsubscribedAt ? "Unsubscribed" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                    {formatDateTime(sub.subscribedAt)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {sub.unsubscribedAt ? formatDateTime(sub.unsubscribedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
