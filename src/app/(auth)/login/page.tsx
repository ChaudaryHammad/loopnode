"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";
import { z } from "zod";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    startTransition(async () => {
      if (!executeRecaptcha) {
        setError("reCAPTCHA is not ready. Please try again in a moment.");
        return;
      }

      const recaptchaToken = await executeRecaptcha("login");
      const response = await loginAction({ ...data, recaptchaToken });
      
      if (response && !response.success) {
        setError(response.error || "Invalid credentials.");
      }
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your LoopNode dashboard
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              className="h-auto p-0 text-xs"
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              tabIndex={-1}
              disabled={isPending}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
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

        <Button type="submit" disabled={isPending} className="w-full" size="lg">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
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
          className="h-auto p-0 font-semibold"
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
