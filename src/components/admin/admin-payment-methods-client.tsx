"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import {
  deletePaymentMethodAction,
  upsertPaymentMethodAction,
} from "@/actions/admin";
import { PaymentMethodDetails } from "@/components/payments/payment-method-details";
import type { PaymentDetailRow } from "@/lib/payment-methods";
import {
  PAYMENT_METHOD_TEMPLATES,
  type PaymentMethodTemplateId,
} from "@/lib/payment-method-templates";
import type { PaymentMethodDisplayStyle } from "@prisma/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type PaymentMethodRow = {
  id: string;
  label: string;
  tagline: string | null;
  displayStyle: PaymentMethodDisplayStyle;
  details: PaymentDetailRow[];
  enabled: boolean;
  sortOrder: number;
};

type FormState = {
  id?: string;
  label: string;
  tagline: string;
  displayStyle: PaymentMethodDisplayStyle;
  details: PaymentDetailRow[];
  enabled: boolean;
  sortOrder: number;
};

const QUICK_START: { id: PaymentMethodTemplateId; label: string }[] = [
  { id: "bank", label: "Bank" },
  { id: "wallet", label: "Wallet" },
  { id: "card", label: "Payoneer" },
  { id: "plain", label: "Blank" },
];

const emptyForm = (): FormState => ({
  label: "",
  tagline: "",
  displayStyle: "PLAIN",
  details: [{ key: "", value: "" }],
  enabled: true,
  sortOrder: 0,
});

function filledDetails(details: PaymentDetailRow[]) {
  return details.filter((row) => row.key.trim() && row.value.trim());
}

export function AdminPaymentMethodsClient({ methods }: { methods: PaymentMethodRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const previewDetails = useMemo(() => filledDetails(form.details), [form.details]);
  const showPreview = form.label.trim().length > 0 && previewDetails.length > 0;

  const openCreate = () => {
    setForm({ ...emptyForm(), sortOrder: methods.length });
    setError(null);
    setDialogOpen(true);
  };

  const applyQuickStart = (templateId: PaymentMethodTemplateId) => {
    const template = PAYMENT_METHOD_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      label: template.defaultLabel,
      tagline: template.defaultTagline,
      displayStyle: template.displayStyle,
      details: template.defaultDetails.map((row) => ({ ...row })),
    }));
  };

  const openEdit = (method: PaymentMethodRow) => {
    setForm({
      id: method.id,
      label: method.label,
      tagline: method.tagline ?? "",
      displayStyle: method.displayStyle,
      details: method.details.length > 0 ? method.details : [{ key: "", value: "" }],
      enabled: method.enabled,
      sortOrder: method.sortOrder,
    });
    setError(null);
    setDialogOpen(true);
  };

  const updateDetail = (index: number, field: "key" | "value", value: string) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await upsertPaymentMethodAction({
        id: form.id,
        label: form.label,
        tagline: form.tagline || null,
        displayStyle: form.displayStyle,
        details: form.details,
        enabled: form.enabled,
        sortOrder: form.sortOrder,
      });

      if (!res.success) {
        setError(res.error ?? "Failed to save.");
        return;
      }

      setMessage(res.message ?? "Saved.");
      setDialogOpen(false);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm("Remove this payment method?")) return;
    startTransition(async () => {
      const res = await deletePaymentMethodAction(id);
      if (res.success) {
        setMessage(res.message ?? "Removed.");
        router.refresh();
      } else {
        setError(res.error ?? "Failed to remove.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment methods</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Shown to customers on the upgrade page.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add method
        </Button>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && !dialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {methods.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Wallet className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="font-medium">No payment methods yet</p>
            <Button onClick={openCreate}>Add method</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <Card key={method.id} className="rounded-xl">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{method.label}</p>
                    <Badge variant={method.enabled ? "secondary" : "outline"} className="text-[10px]">
                      {method.enabled ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                  {method.tagline && (
                    <p className="text-sm text-muted-foreground mt-0.5">{method.tagline}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {method.details.map((d) => `${d.key}: ${d.value}`).join(" · ")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(method)}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    disabled={isPending}
                    onClick={() => remove(method.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>{form.id ? "Edit payment method" : "Add payment method"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5 max-h-[min(70vh,640px)] overflow-y-auto">
            {!form.id && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Quick start</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_START.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickStart(item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pm-label">Name *</Label>
              <Input
                id="pm-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="HBL Bank transfer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pm-tagline">Instructions</Label>
              <Textarea
                id="pm-tagline"
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Send the plan amount and save your transaction ID"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Account details</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      details: [...f.details, { key: "", value: "" }],
                    }))
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add row
                </Button>
              </div>
              <div className="space-y-2">
                {form.details.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={row.key}
                      onChange={(e) => updateDetail(index, "key", e.target.value)}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <Input
                      value={row.value}
                      onChange={(e) => updateDetail(index, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-[1.4] font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={form.details.length === 1}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          details: f.details.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display style</Label>
              <div className="flex gap-2">
                {(["PLAIN", "CARD"] as const).map((style) => (
                  <Button
                    key={style}
                    type="button"
                    size="sm"
                    variant={form.displayStyle === style ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, displayStyle: style }))}
                  >
                    {style === "CARD" ? "Card" : "Plain"}
                  </Button>
                ))}
              </div>
            </div>

            {showPreview && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Preview</Label>
                <PaymentMethodDetails
                  label={form.label.trim()}
                  tagline={form.tagline.trim() || null}
                  details={previewDetails}
                  displayStyle={form.displayStyle}
                  showCopy={false}
                  embedded
                />
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <Label htmlFor="pm-enabled" className="font-normal">
                Visible to customers
              </Label>
              <Switch
                id="pm-enabled"
                checked={form.enabled}
                onCheckedChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={isPending || !form.label.trim()}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
