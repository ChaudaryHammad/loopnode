"use client";

import React, { useMemo, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { websiteSchema } from "@/lib/validations/website";
import { addWebsiteAction, editWebsiteAction } from "@/actions/websites";
import { ScanFrequency } from "@prisma/client";
import { Loader2, Plus, Edit, CalendarClock } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NextScanSchedule } from "@/components/websites/next-scan-schedule";
import { computeNextScanAt } from "@/lib/scan-schedule";

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

function getWeekdayLabel(dayValue: number | null | undefined): string {
  return WEEKDAYS.find((day) => day.value === dayValue)?.label ?? "Monday";
}

interface WebsiteFormProps {
  websiteId?: string;
  canScheduleScans?: boolean;
  defaultValues?: {
    name: string;
    url: string;
    scanFrequency: ScanFrequency;
    scanTimezone?: string;
    scanTimeOfDay?: string;
    scanDayOfWeek?: number | null;
    scanDayOfMonth?: number | null;
    nextScanAt?: Date | string | null;
  };
  onSuccess?: () => void;
}

export function WebsiteForm({
  websiteId,
  canScheduleScans = false,
  defaultValues,
  onSuccess,
}: WebsiteFormProps) {
  const [isPending, startTransition] = useTransition();

  const isEditMode = !!websiteId;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(websiteSchema),
    defaultValues: defaultValues || {
      name: "",
      url: "",
      scanFrequency: ScanFrequency.MANUAL,
      scanTimezone: "UTC",
      scanTimeOfDay: "09:00",
      scanDayOfWeek: 1,
      scanDayOfMonth: 1,
    },
  });

  const scanFrequency = watch("scanFrequency");
  const scanTimezone = watch("scanTimezone");
  const scanTimeOfDay = watch("scanTimeOfDay");
  const scanDayOfWeek = watch("scanDayOfWeek");
  const scanDayOfMonth = watch("scanDayOfMonth");

  const nextScanAt = useMemo(() => {
    if (
      !scanFrequency ||
      scanFrequency === ScanFrequency.MANUAL ||
      !canScheduleScans
    ) {
      return null;
    }

    return computeNextScanAt({
      frequency: scanFrequency,
      timezone: scanTimezone ?? "UTC",
      timeOfDay: scanTimeOfDay,
      dayOfWeek: scanDayOfWeek,
      dayOfMonth: scanDayOfMonth,
    });
  }, [
    scanFrequency,
    scanTimezone,
    scanTimeOfDay,
    scanDayOfWeek,
    scanDayOfMonth,
    canScheduleScans,
  ]);

  const onSubmit = (data: {
    name: string;
    url: string;
    scanFrequency: ScanFrequency;
    scanTimezone: string;
    scanTimeOfDay: string;
    scanDayOfWeek?: number | null;
    scanDayOfMonth?: number | null;
  }) => {
    startTransition(async () => {
      const res = isEditMode
        ? await editWebsiteAction(websiteId!, data)
        : await addWebsiteAction(data);

      if (res.success) {
        toast.success(
          isEditMode
            ? "Website details updated successfully!"
            : "Website connected successfully!"
        );
        if (!isEditMode) reset();
        onSuccess?.();
      } else {
        toast.error(res.error || "Failed to process form.");
      }
    });
  };

  return (
    <Card className="border-border/30 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {isEditMode ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
          {isEditMode ? "Edit connected website" : "Connect new website"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Friendly name</Label>
            <Input
              id="name"
              placeholder="My Personal Blog"
              disabled={isPending}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              disabled={isPending}
              aria-invalid={!!errors.url}
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-border/30 bg-secondary/10 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CalendarClock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Audit schedule</p>
                <p className="text-xs text-muted-foreground">
                  {canScheduleScans
                    ? "Choose how often Health Mesh should run automated audits for this site."
                    : "Automated scans require Pro or Agency. Manual audits are always available."}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scan frequency</Label>
              <Controller
                name="scanFrequency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ScanFrequency.MANUAL}>Manual scans only</SelectItem>
                      <SelectItem value={ScanFrequency.DAILY} disabled={!canScheduleScans}>
                        Daily scheduled audits
                      </SelectItem>
                      <SelectItem value={ScanFrequency.WEEKLY} disabled={!canScheduleScans}>
                        Weekly scheduled audits
                      </SelectItem>
                      <SelectItem value={ScanFrequency.MONTHLY} disabled={!canScheduleScans}>
                        Monthly scheduled audits
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {!canScheduleScans ? (
                <p className="text-xs text-muted-foreground">
                  Upgrade to Pro or Agency to enable automated scheduling.
                </p>
              ) : null}
              {errors.scanFrequency && (
                <p className="text-xs text-destructive">{errors.scanFrequency.message}</p>
              )}
            </div>

            {scanFrequency !== ScanFrequency.MANUAL && canScheduleScans ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scanTimeOfDay">Time of day</Label>
                  <Input
                    id="scanTimeOfDay"
                    type="time"
                    disabled={isPending}
                    {...register("scanTimeOfDay")}
                  />
                  {errors.scanTimeOfDay ? (
                    <p className="text-xs text-destructive">{errors.scanTimeOfDay.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Controller
                    name="scanTimezone"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {scanFrequency === ScanFrequency.WEEKLY ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Day of week</Label>
                    <Controller
                      name="scanDayOfWeek"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value ?? 1)}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select day">
                              {(value) => getWeekdayLabel(Number(value))}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {WEEKDAYS.map((day) => (
                              <SelectItem key={day.value} value={String(day.value)}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.scanDayOfWeek ? (
                      <p className="text-xs text-destructive">{errors.scanDayOfWeek.message}</p>
                    ) : null}
                  </div>
                ) : null}

                {scanFrequency === ScanFrequency.MONTHLY ? (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="scanDayOfMonth">Day of month</Label>
                    <Input
                      id="scanDayOfMonth"
                      type="number"
                      min={1}
                      max={28}
                      disabled={isPending}
                      {...register("scanDayOfMonth", { valueAsNumber: true })}
                    />
                    {errors.scanDayOfMonth ? (
                      <p className="text-xs text-destructive">{errors.scanDayOfMonth.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Uses day 1–28 for consistency across months.</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {nextScanAt ? (
              <div className="rounded-lg border border-border/20 bg-background/60 px-3 py-2">
                <p className="text-xs text-muted-foreground mb-1">Next scheduled audit</p>
                <NextScanSchedule
                  nextScanAt={nextScanAt}
                  timezone={scanTimezone ?? "UTC"}
                  variant="block"
                />
              </div>
            ) : null}
          </div>

          <Button type="submit" disabled={isPending} className="w-full" size="lg">
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving website...
              </>
            ) : isEditMode ? (
              "Save changes"
            ) : (
              "Connect website"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
