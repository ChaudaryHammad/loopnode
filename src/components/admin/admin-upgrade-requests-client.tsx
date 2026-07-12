"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Search, XCircle } from "lucide-react";
import {
  approveUpgradeRequestAction,
  rejectUpgradeRequestAction,
} from "@/actions/admin";
import { PLAN_LABELS, PLAN_SITE_LIMITS } from "@/lib/plans";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlanTier } from "@prisma/client";

type UpgradeRequestRow = {
  id: string;
  requestedPlan: PlanTier;
  paymentMethodLabel: string;
  paymentReference: string;
  paymentProofUrl: string | null;
  userNote: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    subscription: {
      plan: PlanTier | null;
      status: string;
      websiteLimitOverride: number | null;
    } | null;
    _count: { websites: number };
  };
};

const STATUS_FILTER = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export function AdminUpgradeRequestsClient({ requests }: { requests: UpgradeRequestRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER)[number]>("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [limitOverride, setLimitOverride] = useState("");
  const [isPending, startTransition] = useTransition();

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.user.email.toLowerCase().includes(q) ||
        r.paymentReference.toLowerCase().includes(q) ||
        (r.user.name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [requests, search, statusFilter]);

  const review = (requestId: string, approve: boolean) => {
    startTransition(async () => {
      const payload = {
        requestId,
        adminNote: adminNote.trim() || null,
        websiteLimitOverride: limitOverride ? Number(limitOverride) : null,
      };

      const res = approve
        ? await approveUpgradeRequestAction(payload)
        : await rejectUpgradeRequestAction(payload);

      if (res.success) {
        toast.fromAction(res, { success: "Updated." });
        setExpandedId(null);
        setAdminNote("");
        setLimitOverride("");
        router.refresh();
      } else {
        toast.fromAction(res, { error: "Action failed." });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/20 pb-6 space-y-1">
        <p className="text-sm text-muted-foreground">
          Review customer payments and activate plans · {pendingCount} pending. You can also grant
          plans or raise limits directly from{" "}
          <a href="/admin/billing" className="text-primary hover:underline">
            Billing
          </a>{" "}
          without a payment record.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search email or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTER.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <React.Fragment key={req.id}>
                  <TableRow>
                    <TableCell>
                      <p className="font-medium">{req.user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{req.user.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.user._count.websites} active site
                        {req.user._count.websites === 1 ? "" : "s"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLAN_LABELS[req.requestedPlan]}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Default limit: {PLAN_SITE_LIMITS[req.requestedPlan]}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{req.paymentMethodLabel}</p>
                      <p className="text-xs font-mono text-muted-foreground">{req.paymentReference}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          req.status === "PENDING"
                            ? "text-amber-400 border-amber-500/30"
                            : req.status === "APPROVED"
                              ? "text-emerald-400 border-emerald-500/30"
                              : "text-rose-400 border-rose-500/30"
                        }
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(req.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedId(expandedId === req.id ? null : req.id);
                          setAdminNote(req.adminNote ?? "");
                          setLimitOverride("");
                        }}
                      >
                        {expandedId === req.id ? "Close" : "Review"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedId === req.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-secondary/10">
                        <div className="py-4 space-y-4 max-w-xl">
                          {req.paymentProofUrl && (
                            <p className="text-sm">
                              <a
                                href={req.paymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View payment screenshot
                              </a>
                            </p>
                          )}
                          {req.userNote && (
                            <p className="text-sm">
                              <span className="font-medium">User note:</span> {req.userNote}
                            </p>
                          )}
                          {req.adminNote && req.status !== "PENDING" && (
                            <p className="text-sm text-muted-foreground">
                              Admin note: {req.adminNote}
                            </p>
                          )}
                          {req.status === "PENDING" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor={`limit-${req.id}`}>
                                  Custom website limit (optional)
                                </Label>
                                <Input
                                  id={`limit-${req.id}`}
                                  type="number"
                                  min={1}
                                  placeholder={String(PLAN_SITE_LIMITS[req.requestedPlan])}
                                  value={limitOverride}
                                  onChange={(e) => setLimitOverride(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Leave empty to use the plan default (
                                  {PLAN_SITE_LIMITS[req.requestedPlan]} sites).
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`note-${req.id}`}>Admin note</Label>
                                <Textarea
                                  id={`note-${req.id}`}
                                  value={adminNote}
                                  onChange={(e) => setAdminNote(e.target.value)}
                                  placeholder="Required for rejection. Optional for approval."
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="gap-1.5"
                                  disabled={isPending}
                                  onClick={() => review(req.id, true)}
                                >
                                  <Check className="w-4 h-4" />
                                  Approve & activate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="gap-1.5"
                                  disabled={isPending}
                                  onClick={() => review(req.id, false)}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
