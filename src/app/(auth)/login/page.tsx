"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";
import { toast } from "@/lib/toast";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrandHeader } from "@/components/brand/auth-brand-header";
import { CadenceLoader } from "@/components/brand/cadence-loader";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { z } from "zod";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    startTransition(async () => {
      if (!executeRecaptcha) {
        toast.error("reCAPTCHA is not ready. Please try again in a moment.");
        return;
      }

      const recaptchaToken = await executeRecaptcha("login");
      const response = await loginAction({ ...data, recaptchaToken });

      if (response && !response.success) {
        toast.error(response.error || "Invalid credentials.");
      }
    });
  };

  return (
    <div className="w-full">
      <AuthBrandHeader
        title="Welcome Back"
        subtitle="Sign in to your Health Mesh account"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-[var(--ln-ink)]"
              render={<Link href="/forgot-password" />}
              nativeButton={false}
            >
              Forgot password?
            </Button>
          </div>
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

        <div className="flex items-center gap-2">
          <Checkbox
            id="rememberMe"
            disabled={isPending}
            checked={watch("rememberMe")}
            onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
          />
          <Label htmlFor="rememberMe" className="font-normal text-muted-foreground cursor-pointer">
            Remember me
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-[var(--ln-ink)] text-white hover:bg-[var(--ln-ink-soft)]"
          size="lg"
        >
          {isPending ? (
            <>
              <CadenceLoader size="sm" className="text-primary-foreground" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Don&apos;t have an account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 font-semibold text-[var(--ln-ink)]"
          render={<Link href="/register" />}
          nativeButton={false}
        >
          Create one now
        </Button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      <LoginForm />
    </GoogleReCaptchaProvider>
  );
}
