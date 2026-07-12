"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Camera,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import {
  removeProfileImageAction,
  uploadProfileImageAction,
} from "@/actions/settings";
import { cn, formatDate } from "@/lib/utils";
import { getUserDisplayName } from "@/lib/user-display";
import { toast } from "@/lib/toast";
import { UserAvatar } from "@/components/user-avatar";
import { PlanBadge } from "@/components/settings/plan-badge";
import { Button } from "@/components/ui/button";
import type { PlanTier } from "@prisma/client";

interface SettingsHeaderProps {
  user: {
    name: string | null;
    email: string;
    emailVerified: Date | string | null;
    createdAt: Date | string;
    image: string | null;
    plan: PlanTier | null;
    planLabel: string;
  };
}

export function SettingsHeader({ user }: SettingsHeaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(user.image);
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isRemovePending, startRemoveTransition] = useTransition();

  const isPending = isUploadPending || isRemovePending;
  const displayName = getUserDisplayName(user.name, user.email);

  useEffect(() => {
    setImage(user.image);
  }, [user.image]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startUploadTransition(async () => {
      const res = await uploadProfileImageAction(formData);
      if (res.success) {
        setImage(res.imageUrl ?? null);
        toast.fromAction(res, {
          success: "Profile photo updated.",
          error: "Failed to upload profile photo.",
        });
        router.refresh();
      } else {
        toast.fromAction(res, {
          success: "Profile photo updated.",
          error: "Failed to upload profile photo.",
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleRemove = () => {
    if (!image || isPending) return;
    if (!confirm("Remove your profile photo?")) return;

    startRemoveTransition(async () => {
      const res = await removeProfileImageAction();
      if (res.success) {
        setImage(null);
        toast.fromAction(res, {
          success: "Profile photo removed.",
          error: "Failed to remove profile photo.",
        });
        router.refresh();
      } else {
        toast.fromAction(res, {
          success: "Profile photo removed.",
          error: "Failed to remove profile photo.",
        });
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border/40 bg-card/80 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <UserAvatar
              name={user.name}
              email={user.email}
              image={image}
              size="xl"
              className="ring-2 ring-border/50"
            />

            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="absolute -bottom-1 -right-1 size-8 rounded-full border border-border/50 shadow-sm"
              title={image ? "Change photo" : "Upload photo"}
              disabled={isPending}
              onClick={() => fileInputRef.current?.click()}
              aria-label={image ? "Change profile photo" : "Upload profile photo"}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </Button>

            {image && !isPending ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="absolute -top-1 -right-1 size-7 rounded-full border border-border/50 bg-background/90 text-muted-foreground hover:text-destructive"
                title="Remove photo"
                onClick={handleRemove}
                aria-label="Remove profile photo"
              >
                <Trash2 className="size-3" />
              </Button>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={isPending}
              onChange={handleFileChange}
            />
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {displayName}
              </h1>
              <PlanBadge plan={user.plan} planLabel={user.planLabel} />
            </div>

            <p className="truncate text-sm text-muted-foreground">{user.email}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  user.emailVerified ? "text-emerald-500" : "text-amber-500"
                )}
              >
                {user.emailVerified ? (
                  <>
                    <ShieldCheck className="size-3.5" />
                    Verified
                  </>
                ) : (
                  <>
                    <ShieldOff className="size-3.5" />
                    Not verified
                  </>
                )}
              </span>
              <span className="hidden text-border sm:inline">·</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                Member since {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
