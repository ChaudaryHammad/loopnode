import { Sparkles } from "lucide-react";
import type { PlanTier, SubscriptionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLAN_STYLES: Record<PlanTier, string> = {
  STARTER:
    "border-slate-500/30 bg-slate-500/10 text-slate-300",
  PRO: "border-primary/35 bg-primary/15 text-primary",
  AGENCY:
    "border-violet-500/35 bg-violet-500/15 text-violet-300",
};

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  TRIALING: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  PAST_DUE: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  CANCELLED: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  EXPIRED: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

interface PlanBadgeProps {
  plan: PlanTier | null;
  planLabel: string;
  className?: string;
}

export function PlanBadge({ plan, planLabel, className }: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold uppercase tracking-wide",
        plan ? PLAN_STYLES[plan] : "border-border/40 bg-muted/40 text-muted-foreground",
        className
      )}
    >
      <Sparkles className="size-3" />
      {planLabel}
    </Badge>
  );
}

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  isTrial?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

export function SubscriptionStatusBadge({
  status,
  isTrial,
  isReadOnly,
  className,
}: SubscriptionStatusBadgeProps) {
  if (isReadOnly) {
    return (
      <Badge variant="outline" className={cn(STATUS_STYLES.EXPIRED, className)}>
        Read-only
      </Badge>
    );
  }

  if (isTrial) {
    return (
      <Badge variant="outline" className={cn(STATUS_STYLES.TRIALING, className)}>
        Trial
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE, className)}>
      {status === "ACTIVE" ? "Active" : status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}
