"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { toast } from "@/lib/toast";

/**
 * Surfaces Auth.js OAuth errors from `?error=` as a toast once per page load.
 */
export function AuthErrorToast() {
  const searchParams = useSearchParams();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error || shown.current === error) return;
    shown.current = error;
    toast.error(getAuthErrorMessage(error));

    // Clean the URL so refresh doesn't re-toast; keep other params.
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, [searchParams]);

  return null;
}
