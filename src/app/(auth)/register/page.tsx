"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema } from "@/lib/validations/auth";
import { registerAction } from "@/actions/auth";
import { toast } from "@/lib/toast";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrandHeader } from "@/components/brand/auth-brand-header";
import { CadenceLoader } from "@/components/brand/cadence-loader";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { z } from "zod";

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    startTransition(async () => {
      if (!executeRecaptcha) {
        toast.error("reCAPTCHA is not ready. Please try again in a moment.");
        return;
      }

      const recaptchaToken = await executeRecaptcha("register");
      const response = await registerAction({ ...data, recaptchaToken });

      if (response.success) {
        toast.success(response.message || "Registration successful! Check your email.");
        reset();
      } else {
        toast.error(response.error || "Something went wrong.");
      }
    });
  };

  return (
    <div className="w-full">
      <AuthBrandHeader
        title="Create an Account"
        subtitle="Start your 14-day free trial — no credit card required"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Your name"
            disabled={isPending}
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isPending}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={!!errors.password}
              className="pr-10"
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
            <p className="text-xs text-destructive">{errors.password.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={!!errors.confirmPassword}
              className="pr-10"
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
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message as string}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            className="font-medium text-[var(--ln-ink)] underline underline-offset-2 hover:text-[var(--ln-ink)]"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="font-medium text-[var(--ln-ink)] underline underline-offset-2 hover:text-[var(--ln-ink)]"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[var(--ln-ink)] text-white hover:bg-[var(--ln-ink-soft)]"
          size="lg"
        >
          {isPending ? (
            <>
              <CadenceLoader size="sm" className="text-primary-foreground" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 font-semibold text-[var(--ln-ink)]"
          render={<Link href="/login" />}
          nativeButton={false}
        >
          Sign in
        </Button>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <RegisterForm />
    </GoogleReCaptchaProvider>
  );
}
