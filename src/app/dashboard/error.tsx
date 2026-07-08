"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This page failed to load. Try again, or return to the dashboard overview.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/dashboard" variant="outline">
          Back to dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
