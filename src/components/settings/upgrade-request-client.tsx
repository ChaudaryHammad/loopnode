"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  MessageSquare,
  Smartphone,
  Wallet,
} from "lucide-react";
import { submitUpgradeRequestAction, uploadPaymentProofAction } from "@/actions/upgrade-requests";
import { PaymentMethodDetails } from "@/components/payments/payment-method-details";
import type { PublicPaymentMethod } from "@/lib/payment-methods";
import { PLAN_LABELS, PLAN_PRICES_USD } from "@/lib/plans";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlanTier } from "@prisma/client";

interface UpgradeRequestClientProps {
  hasPendingRequest: boolean;
  currentPlanLabel: string;
  paymentMethods: PublicPaymentMethod[];
}

function methodIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("bank") || lower.includes("wire") || lower.includes("iban")) {
    return Building2;
  }
  if (
    lower.includes("easypaisa") ||
    lower.includes("jazz") ||
    lower.includes("wallet") ||
    lower.includes("mobile")
  ) {
    return Smartphone;
  }
  if (lower.includes("payoneer") || lower.includes("paypal")) {
    return Wallet;
  }
  return CreditCard;
}

export function UpgradeRequestClient({
  hasPendingRequest,
  currentPlanLabel,
  paymentMethods,
}: UpgradeRequestClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const [requestedPlan, setRequestedPlan] = useState<PlanTier>("PRO");
  const [paymentMethodId, setPaymentMethodId] = useState<string>(
    paymentMethods[0]?.id ?? ""
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [userNote, setUserNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);
  const amountDue = PLAN_PRICES_USD[requestedPlan];

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!paymentMethodId) {
      setError("Select a payment method.");
      return;
    }

    startTransition(async () => {
      let paymentProofUrl: string | undefined;

      if (proofFile) {
        const formData = new FormData();
        formData.set("file", proofFile);
        const upload = await uploadPaymentProofAction(formData);
        if (!upload.success || !upload.url) {
          setError(upload.error ?? "Failed to upload screenshot.");
          return;
        }
        paymentProofUrl = upload.url;
      }

      const res = await submitUpgradeRequestAction({
        requestedPlan,
        paymentMethodConfigId: paymentMethodId,
        paymentReference,
        paymentProofUrl,
        userNote: userNote || undefined,
      });

      if (!res.success) {
        setError(res.error ?? "Failed to submit request.");
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  };

  if (hasPendingRequest) {
    return (
      <div className="max-w-2xl space-y-6">
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to billing
        </Link>
        <Alert>
          <AlertDescription>
            Your payment is being verified. We&apos;ll activate your plan once approved — usually
            within 1–2 business days.
          </AlertDescription>
        </Alert>
        <ButtonLink href="/dashboard/settings/billing">View billing</ButtonLink>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl space-y-6">
        <Card className="rounded-2xl border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground">Payment submitted</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re verifying your payment. Your plan activates once approved — you&apos;ll
                  get an in-app notification and email.
                </p>
              </div>
            </div>
            <ButtonLink href="/dashboard/settings/billing">Back to billing</ButtonLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to billing
        </Link>
        <Alert>
          <AlertDescription>
            Payment options are being set up. Please contact support to complete your upgrade.
          </AlertDescription>
        </Alert>
        <ButtonLink href="/contact" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Contact support
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/settings/billing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to billing
      </Link>

      <div className="space-y-2">
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
          Payment required
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">Upgrade your plan</h1>
        <p className="text-sm text-muted-foreground">
          Current plan: {currentPlanLabel}. Complete payment to activate your new plan — approval
          is typically within 1–2 business days.
        </p>
      </div>

      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="pt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</p>
            <p className="text-3xl font-bold tabular-nums">
              ${amountDue}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{PLAN_LABELS[requestedPlan]}</p>
            <p className="text-xs text-muted-foreground">Billed monthly after approval</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">1. Choose your plan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["PRO", "AGENCY"] as const).map((plan) => (
              <button
                key={plan}
                type="button"
                onClick={() => setRequestedPlan(plan)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  requestedPlan === plan
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/30 hover:border-border/60"
                }`}
              >
                <p className="font-bold">{PLAN_LABELS[plan]}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ${PLAN_PRICES_USD[plan]}/month
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">2. Send payment</CardTitle>
            <CardDescription>
              Transfer ${amountDue} using one of the options below, then continue to step 3.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = methodIcon(method.label);
              const selected = paymentMethodId === method.id;

              return (
                <div key={method.id} className="space-y-0">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodId(method.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border/30 hover:border-border/60 bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          selected ? "bg-primary/15 text-primary" : "bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{method.label}</p>
                        {method.tagline && (
                          <p className="text-sm text-muted-foreground mt-0.5">{method.tagline}</p>
                        )}
                      </div>
                      {selected && (
                        <Badge className="shrink-0">Selected</Badge>
                      )}
                    </div>
                  </button>

                  {selected && (
                    <PaymentMethodDetails
                      label={method.label}
                      tagline={method.tagline}
                      details={method.details}
                      displayStyle={method.displayStyle}
                      copiedValue={copiedValue}
                      onCopy={copyValue}
                    />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-lg">3. Confirm your payment</CardTitle>
            <CardDescription>
              Enter the transaction ID from your payment so we can verify and activate your plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Transaction ID / reference *</Label>
              <Input
                id="paymentReference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. T1234567890"
                required
                minLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentProof">Payment screenshot (optional)</Label>
              <Input
                id="paymentProof"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Receipt or transfer screenshot — helps us verify faster.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userNote">Note (optional)</Label>
              <Textarea
                id="userNote"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder="Payment date, sender name, or bank reference…"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending || !paymentMethodId} className="gap-2">
            <CreditCard className="w-4 h-4" />
            {isPending ? "Submitting…" : "Submit payment for verification"}
          </Button>
          <ButtonLink href="/contact" variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Need help?
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
