"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Check,
  Clock,
  MessageSquare,
  Sparkles,
  XCircle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import { PLAN_PRICES_USD, PLAN_LABELS, PLAN_SCAN_SCHEDULING } from "@/lib/plans";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";

interface Entitlements {
  plan: PlanTier | null;
  planLabel: string;
  status: SubscriptionStatus;
  websiteLimit: number;
  websiteCount: number;
  websitesRemaining: number;
  canAddWebsite: boolean;
  canScheduleScans: boolean;
  isTrial: boolean;
  isReadOnly: boolean;
  trialEndsAt: string | null;
  accountMessage: string | null;
}

interface UpgradeRequestRow {
  id: string;
  requestedPlan: PlanTier;
  paymentMethod: string;
  paymentReference: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface BillingSettingsClientProps {
  entitlements: Entitlements;
  requests: UpgradeRequestRow[];
  hasPendingRequest: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

export function BillingSettingsClient({
  entitlements,
  requests,
  hasPendingRequest,
}: BillingSettingsClientProps) {
  const usagePercent = Math.min(
    100,
    Math.round((entitlements.websiteCount / entitlements.websiteLimit) * 100)
  );
  const scanSchedulingCopy = entitlements.plan
    ? PLAN_SCAN_SCHEDULING[entitlements.plan]
    : "Manual scans only";

  return (
    <div className="space-y-6 max-w-3xl">
      {entitlements.isReadOnly && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <AlertDescription>
            Your account is read-only. Upgrade to continue adding websites and running audits.
          </AlertDescription>
        </Alert>
      )}

      {entitlements.accountMessage && (
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="w-4 h-4" />
          <AlertDescription>
            <span className="font-medium text-foreground">Message from our team: </span>
            {entitlements.accountMessage}
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl border-border/30">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
              {entitlements.isTrial && entitlements.trialEndsAt
                ? `Trial ends ${formatDateTime(entitlements.trialEndsAt)} — upgrade to keep full access`
                : "Monthly subscription · renew by completing payment when upgrading"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connected websites</span>
              <span className="font-medium tabular-nums">
                {entitlements.websiteCount} / {entitlements.websiteLimit}
              </span>
            </div>
            <Progress
              value={usagePercent}
              className="gap-0 [&_[data-slot=progress-track]]:h-2"
            />
            <p className="text-xs text-muted-foreground">
              {entitlements.websitesRemaining} slot{entitlements.websitesRemaining === 1 ? "" : "s"}{" "}
              remaining · Each domain can be reconnected once after removal
            </p>
          </div>

          <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Automated scans</p>
                <p className="text-sm text-muted-foreground">{scanSchedulingCopy}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href="/dashboard/settings/billing/upgrade"
              className="gap-2"
              disabled={hasPendingRequest}
            >
              <Sparkles className="w-4 h-4" />
              {hasPendingRequest ? "Payment under review" : "Upgrade plan"}
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Contact support
            </ButtonLink>
            <ButtonLink href="/pricing" variant="ghost">
              Compare plans
            </ButtonLink>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["PRO", "AGENCY"] as const).map((plan) => (
          <Card key={plan} className="rounded-2xl border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{PLAN_LABELS[plan]}</CardTitle>
              <CardDescription>
                ${PLAN_PRICES_USD[plan]}/mo · billed monthly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {plan === "PRO" ? "15" : "50"}
                <span className="text-sm font-normal text-muted-foreground ml-1">websites</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length > 0 && (
        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">Payment history</CardTitle>
            <CardDescription>Track submitted payments and verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-border/30 bg-secondary/10 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STATUS_STYLES[req.status] ?? ""}>
                      {req.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {req.status === "APPROVED" && <Check className="w-3 h-3" />}
                      {req.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                      {req.status}
                    </Badge>
                    <span className="text-sm font-medium">{PLAN_LABELS[req.requestedPlan]}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(req.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  via {req.paymentMethod} · Ref:{" "}
                  <span className="font-mono text-foreground">{req.paymentReference}</span>
                </p>
                {req.adminNote && (
                  <p className="text-sm text-muted-foreground border-t border-border/20 pt-2">
                    {req.adminNote}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-border/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </CardTitle>
          <CardDescription>
            Upgrade updates appear in the bell icon in your dashboard header
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
