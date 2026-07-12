"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Wallet } from "lucide-react";
import {
  initMissingSubscriptionsAction,
  initUserSubscriptionAction,
  updateSubscriptionAction,
} from "@/actions/admin";
import { PLAN_LABELS, PLAN_PRICES_USD, PLAN_SITE_LIMITS } from "@/lib/plans";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SubscriptionRow = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userBanned: boolean;
  websiteCount: number;
  plan: string | null;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  websiteLimitOverride: number | null;
  adminNotes: string | null;
  updatedAt: string;
};

type UserWithoutSub = {
  id: string;
  name: string | null;
  email: string;
  websiteCount: number;
  createdAt: string;
};

const STATUSES = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;
const PLANS = ["STARTER", "PRO", "AGENCY"] as const;

export function AdminBillingClient({
  subscriptions,
  usersWithoutSubscription,
  estimatedMrr,
}: {
  subscriptions: SubscriptionRow[];
  usersWithoutSubscription: UserWithoutSub[];
  estimatedMrr: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<SubscriptionRow | null>(null);
  const [form, setForm] = useState({
    plan: "" as string,
    status: "TRIALING",
    trialEndsAt: "",
    currentPeriodEnd: "",
    cancelAtPeriodEnd: false,
    adminNotes: "",
    websiteLimitOverride: "",
    notifyUser: true,
  });

  const openEdit = (row: SubscriptionRow) => {
    setEditing(row);
    setForm({
      plan: row.plan ?? "",
      status: row.status,
      trialEndsAt: row.trialEndsAt ? row.trialEndsAt.slice(0, 10) : "",
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.slice(0, 10) : "",
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      adminNotes: row.adminNotes ?? "",
      websiteLimitOverride:
        row.websiteLimitOverride != null ? String(row.websiteLimitOverride) : "",
      notifyUser: true,
    });
  };

  const saveSubscription = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await updateSubscriptionAction({
        userId: editing.userId,
        plan: form.plan ? (form.plan as (typeof PLANS)[number]) : null,
        status: form.status as (typeof STATUSES)[number],
        trialEndsAt: form.trialEndsAt || null,
        currentPeriodEnd: form.currentPeriodEnd || null,
        cancelAtPeriodEnd: form.cancelAtPeriodEnd,
        adminNotes: form.adminNotes || null,
        websiteLimitOverride: form.websiteLimitOverride
          ? Number(form.websiteLimitOverride)
          : null,
        notifyUser: form.notifyUser,
      });
      if (res.success) {
        toast.fromAction(res, { success: "Saved." });
        setEditing(null);
        router.refresh();
      } else {
        toast.fromAction(res, { error: "Failed to save." });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/20 pb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Subscription records, plan overrides, and website limits. Grant upgrades here without
              requiring a customer payment submission.
            </p>
          </div>
          <ButtonLink href="/admin/payment-methods" variant="outline" className="gap-2 shrink-0">
            <Wallet className="w-4 h-4" />
            Payment methods
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estimated MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">${estimatedMrr}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {subscriptions.filter((s) => s.status === "ACTIVE").length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Past due / expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {subscriptions.filter((s) => s.status === "PAST_DUE" || s.status === "EXPIRED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {usersWithoutSubscription.length > 0 && (
        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm">
              {usersWithoutSubscription.length} user
              {usersWithoutSubscription.length === 1 ? "" : "s"} without a subscription record.
            </p>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const res = await initMissingSubscriptionsAction();
                  toast.fromAction(res, { success: "Done.", error: "Failed." });
                  if (res.success) {
                    router.refresh();
                  }
                })
              }
            >
              <Plus />
              Create trial records
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-border/30 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Trial / period end</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((row) => (
                <TableRow key={row.id} className={row.userBanned ? "opacity-60" : undefined}>
                  <TableCell>
                    <p className="text-sm font-medium">{row.userName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {row.websiteCount} site{row.websiteCount === 1 ? "" : "s"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {row.plan ? (
                      <span className="text-sm">
                        {PLAN_LABELS[row.plan as keyof typeof PLAN_LABELS]} ($
                        {PLAN_PRICES_USD[row.plan as keyof typeof PLAN_PRICES_USD]})
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "ACTIVE"
                          ? "default"
                          : row.status === "PAST_DUE"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {row.trialEndsAt && <p>Trial: {formatDateTime(row.trialEndsAt)}</p>}
                    {row.currentPeriodEnd && <p>Period: {formatDateTime(row.currentPeriodEnd)}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Edit subscription"
                      disabled={isPending}
                      onClick={() => openEdit(row)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {usersWithoutSubscription.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Users without subscription</h2>
          <Card className="rounded-2xl border-border/30">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {usersWithoutSubscription.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              const res = await initUserSubscriptionAction(user.id);
                              toast.fromAction(res, { success: "Created.", error: "Failed." });
                              if (res.success) {
                                router.refresh();
                              }
                            })
                          }
                        >
                          Init trial
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual subscription override</DialogTitle>
            <DialogDescription>
              {editing?.userEmail} — changes apply immediately. The user sees your note on their
              billing page and gets a notification when enabled below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={form.plan || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, plan: !v || v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {PLANS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLAN_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v ?? f.status }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trial ends</Label>
                <Input
                  type="date"
                  value={form.trialEndsAt}
                  onChange={(e) => setForm((f) => ({ ...f, trialEndsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Period end</Label>
                <Input
                  type="date"
                  value={form.currentPeriodEnd}
                  onChange={(e) => setForm((f) => ({ ...f, currentPeriodEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website limit override</Label>
              <Input
                type="number"
                min={1}
                placeholder={
                  form.plan
                    ? `Default: ${PLAN_SITE_LIMITS[form.plan as keyof typeof PLAN_SITE_LIMITS]}`
                    : "Uses plan default"
                }
                value={form.websiteLimitOverride}
                onChange={(e) =>
                  setForm((f) => ({ ...f, websiteLimitOverride: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the plan default (
                {form.plan
                  ? PLAN_SITE_LIMITS[form.plan as keyof typeof PLAN_SITE_LIMITS]
                  : "trial = 15"}
                ). Starter = 3, Pro = 15, Agency = 50.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Message to customer</Label>
              <Textarea
                value={form.adminNotes}
                onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
                placeholder="Shown on their billing page — e.g. Your trial is ending, please upgrade."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/30 p-3">
              <div>
                <p className="text-sm font-medium">Notify customer</p>
                <p className="text-xs text-muted-foreground">In-app bell + email</p>
              </div>
              <Switch
                checked={form.notifyUser}
                onCheckedChange={(notifyUser) => setForm((f) => ({ ...f, notifyUser }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button disabled={isPending} onClick={saveSubscription}>
              Save override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
