"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/actions/auth";
import { Activity, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: any) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const response = await forgotPasswordAction(data);
      if (response.success) {
        setSuccess(response.message || "Reset link sent! Check your inbox.");
      } else {
        setError(response.error || "Failed to submit request.");
      }
    });
  };

  return (
    <div className="w-full">
      {/* Brand Logo & Heading */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Reset Password
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll send you a secure link to recover your account
        </p>
      </div>

      {success ? (
        <div className="text-center py-6 px-4 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-4 text-primary">
            <Mail className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Link Dispatched</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {success}
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </div>
          )}

          {/* Reset Request Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                disabled={isPending}
                className={`w-full px-4 py-2.5 rounded-xl bg-secondary/30 border ${
                  errors.email ? "border-destructive" : "border-border/40"
                } text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message as string}</p>
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
                  Sending link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
