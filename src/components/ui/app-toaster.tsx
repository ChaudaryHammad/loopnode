"use client";

import { Toaster } from "@/components/ui/sonner";

/**
 * Site-wide toast host. Mount once inside ThemeProvider (root layout).
 * Trigger toasts with `import { toast } from "@/lib/toast"`.
 */
export function AppToaster() {
  return <Toaster />;
}
