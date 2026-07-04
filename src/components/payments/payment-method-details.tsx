"use client";

import { Copy } from "lucide-react";
import type { PaymentDetailRow } from "@/lib/payment-methods";
import type { PaymentMethodDisplayStyle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaymentMethodDetailsProps = {
  label: string;
  tagline: string | null;
  details: PaymentDetailRow[];
  displayStyle: PaymentMethodDisplayStyle;
  copiedValue?: string | null;
  onCopy?: (value: string) => void;
  embedded?: boolean;
  showCopy?: boolean;
};

function DetailRows({
  details,
  showCopy,
  copiedValue,
  onCopy,
}: {
  details: PaymentDetailRow[];
  showCopy: boolean;
  copiedValue?: string | null;
  onCopy?: (value: string) => void;
}) {
  return (
    <div className="divide-y divide-border/30 rounded-lg border border-border/30 bg-background/50 overflow-hidden">
      {details.map((row) => (
        <div key={`${row.key}-${row.value}`} className="px-4 py-3">
          <p className="text-xs text-muted-foreground">{row.key}</p>
          <div className="mt-1 flex items-start gap-2">
            <p className="flex-1 min-w-0 font-mono text-sm break-words">{row.value}</p>
            {showCopy && onCopy && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onCopy(row.value)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {showCopy && copiedValue && (
        <p className="px-4 py-2 text-xs text-emerald-500 border-t border-border/30">Copied</p>
      )}
    </div>
  );
}

export function PaymentMethodDetails({
  label,
  tagline,
  details,
  displayStyle,
  copiedValue = null,
  onCopy,
  embedded = false,
  showCopy = true,
}: PaymentMethodDetailsProps) {
  const canCopy = showCopy && !!onCopy;

  if (displayStyle === "CARD") {
    return (
      <div
        className={cn(
          !embedded && "mt-2",
          "rounded-xl border border-border/40 bg-gradient-to-b from-primary/8 to-card p-5 space-y-4"
        )}
      >
        <div className="text-center space-y-1">
          <p className="text-base font-semibold">{label}</p>
          {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
        </div>
        <DetailRows
          details={details}
          showCopy={canCopy}
          copiedValue={copiedValue}
          onCopy={onCopy}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        !embedded && "mt-2",
        "rounded-xl border border-border/30 bg-secondary/10 p-4 space-y-3"
      )}
    >
      <div>
        <p className="font-medium">{label}</p>
        {tagline && <p className="text-sm text-muted-foreground mt-0.5">{tagline}</p>}
      </div>
      <DetailRows
        details={details}
        showCopy={canCopy}
        copiedValue={copiedValue}
        onCopy={onCopy}
      />
    </div>
  );
}
