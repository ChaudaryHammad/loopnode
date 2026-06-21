"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/actions/auth";
import { Activity, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPasswordForm({ token }: { token?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: any) => {
    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const response = await resetPasswordAction(token, data);
      if (response.success) {
        setSuccess(response.message || "Password updated successfully!");
      } else {
        setError(response.error || "Failed to update password.");
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
      {/* Brand Logo & Heading */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          New Password
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please enter your secure new password below
        </p>
      </div>

      {success ? (
        <div className="text-center py-6 px-4 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-4 text-green-500">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Password Updated</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {success}
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {/* Reset password form */}
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
