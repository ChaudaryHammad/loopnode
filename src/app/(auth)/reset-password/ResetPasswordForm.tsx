"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/actions/auth";
import { toast } from "@/lib/toast";
import { Eye, EyeOff } from "lucide-react";
import { AuthBrandHeader } from "@/components/brand/auth-brand-header";
import { CadenceLoader } from "@/components/brand/cadence-loader";

export default function ResetPasswordForm({ token }: { token?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: { password: string; confirmPassword: string }) => {
    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }

    startTransition(async () => {
      const response = await resetPasswordAction(token, data);
      if (response.success) {
        reset({ password: "", confirmPassword: "" });
        setShowPassword(false);
        setShowConfirmPassword(false);
        toast.success(response.message || "Password updated successfully!");
      } else {
        toast.error(response.error || "Failed to update password.");
      }
    });
  };

  if (!token) {
    return (
      <div className="text-center py-6">
        <h3 className="text-lg font-bold text-destructive mb-2">Invalid Request</h3>
        <p className="text-sm text-muted-foreground mb-6">
          The password reset link is invalid, corrupted, or missing a token.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-colors"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AuthBrandHeader
        title="New Password"
        subtitle="Please enter your secure new password below"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isPending}
              className={`w-full pl-4 pr-11 py-2 rounded-xl bg-secondary/30 border ${
                errors.password ? "border-destructive" : "border-border/40"
              } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              disabled={isPending}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--ln-faint)] hover:text-[var(--ln-ink)] disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.75} />
              ) : (
                <Eye className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isPending}
              className={`w-full pl-4 pr-11 py-2 rounded-xl bg-secondary/30 border ${
                errors.confirmPassword ? "border-destructive" : "border-border/40"
              } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              disabled={isPending}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--ln-faint)] hover:text-[var(--ln-ink)] disabled:opacity-50"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" strokeWidth={1.75} />
              ) : (
                <Eye className="size-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message as string}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center px-4 py-3 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-white font-semibold text-sm hover:bg-[var(--ln-ink-soft)] active:translate-y-px transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isPending ? (
            <>
              <CadenceLoader size="sm" className="mr-2 text-white" />
              Updating password...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        <Link
          href="/login"
          className="font-semibold text-[var(--ln-ink)] hover:text-[var(--ln-ink-soft)] transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
