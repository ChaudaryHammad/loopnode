"use client";

import React, { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { websiteSchema, WebsiteFormValues } from "@/lib/validations/website";
import { addWebsiteAction, editWebsiteAction } from "@/actions/websites";
import { ScanFrequency } from "@prisma/client";
import { Loader2, Plus, Edit } from "lucide-react";

interface WebsiteFormProps {
  websiteId?: string; // If present, we are in Edit mode
  defaultValues?: {
    name: string;
    url: string;
    scanFrequency: ScanFrequency;
  };
  onSuccess?: () => void;
}

export function WebsiteForm({ websiteId, defaultValues, onSuccess }: WebsiteFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditMode = !!websiteId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(websiteSchema),
    defaultValues: defaultValues || {
      name: "",
      url: "",
      scanFrequency: ScanFrequency.MANUAL,
    },
  });

  const onSubmit = (data: any) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      let res;
      if (isEditMode) {
        res = await editWebsiteAction(websiteId!, data);
      } else {
        res = await addWebsiteAction(data);
      }

      if (res.success) {
        setSuccess(
          isEditMode
            ? "Website details updated successfully!"
            : "Website connected successfully!"
        );
        if (!isEditMode) {
          reset();
        }
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(res.error || "Failed to process form.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card border border-border/30 rounded-2xl p-6 select-none">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        {isEditMode ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
        {isEditMode ? "Edit Connected Website" : "Connect New Website"}
      </h3>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Friendly Name
        </label>
        <input
          type="text"
          placeholder="My Personal Blog"
          disabled={isPending}
          className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
            errors.name ? "border-destructive" : "border-border/40"
          } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Website URL
        </label>
        <input
          type="text"
          placeholder="https://example.com"
          disabled={isPending}
          className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
            errors.url ? "border-destructive" : "border-border/40"
          } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
          {...register("url")}
        />
        {errors.url && (
          <p className="text-xs text-destructive mt-1">{errors.url.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Scan Frequency
        </label>
        <select
          disabled={isPending}
          className="w-full px-4 py-2.5 rounded-xl bg-secondary/30 border border-border/40 text-foreground outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 cursor-pointer"
          {...register("scanFrequency")}
        >
          <option value={ScanFrequency.MANUAL}>Manual Scans Only</option>
          <option value={ScanFrequency.DAILY}>Daily Scheduled Audits</option>
          <option value={ScanFrequency.WEEKLY}>Weekly Scheduled Audits</option>
          <option value={ScanFrequency.MONTHLY}>Monthly Scheduled Audits</option>
        </select>
        {errors.scanFrequency && (
          <p className="text-xs text-destructive mt-1">{errors.scanFrequency.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving website...
          </>
        ) : (
          <>
            {isEditMode ? "Save Changes" : "Connect Website"}
          </>
        )}
      </button>
    </form>
  );
}
