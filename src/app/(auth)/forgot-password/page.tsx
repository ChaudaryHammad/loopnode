"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/actions/auth";
import { toast } from "@/lib/toast";
import { AuthBrandHeader } from "@/components/brand/auth-brand-header";
import { CadenceLoader } from "@/components/brand/cadence-loader";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: { email: string }) => {
    startTransition(async () => {
      const response = await forgotPasswordAction(data);
      if (response.success) {
        toast.success(response.message || "Reset link sent! Check your inbox.");
        reset();
      } else {
        toast.error(response.error || "Failed to submit request.");
      }
    });
  };

  return (
    <div className="w-full">
      <AuthBrandHeader
        title="Reset Password"
        subtitle="We'll send you a secure link to recover your account"
      />

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
          className="w-full flex items-center justify-center px-4 py-3 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-white font-semibold text-sm hover:bg-[var(--ln-ink-soft)] active:translate-y-px transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isPending ? (
            <>
              <CadenceLoader size="sm" className="mr-2 text-white" />
              Sending link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--ln-ink)] hover:text-[var(--ln-ink-soft)] transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
