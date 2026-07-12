import { toast as sonnerToast } from "sonner";

type ToastDescription = string | undefined;

type ActionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Site-wide toast helpers built on shadcn/Sonner.
 * Prefer this over inline Alert banners for action success/error feedback.
 */
export const toast = {
  success(message: string, description?: ToastDescription) {
    return sonnerToast.success(message, description ? { description } : undefined);
  },

  error(message: string, description?: ToastDescription) {
    return sonnerToast.error(message, description ? { description } : undefined);
  },

  info(message: string, description?: ToastDescription) {
    return sonnerToast.info(message, description ? { description } : undefined);
  },

  warning(message: string, description?: ToastDescription) {
    return sonnerToast.warning(message, description ? { description } : undefined);
  },

  message(message: string, description?: ToastDescription) {
    return sonnerToast(message, description ? { description } : undefined);
  },

  loading(message: string) {
    return sonnerToast.loading(message);
  },

  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },

  /** Show success or error from a server-action style result. */
  fromAction(
    result: ActionResult,
    fallbacks?: { success?: string; error?: string }
  ) {
    if (result.success) {
      return toast.success(result.message ?? fallbacks?.success ?? "Done.");
    }
    return toast.error(result.error ?? fallbacks?.error ?? "Something went wrong.");
  },
};

export type { ActionResult };
