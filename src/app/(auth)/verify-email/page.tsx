import React from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/actions/auth";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthBrandHeader } from "@/components/brand/auth-brand-header";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const token = typeof resolvedParams.token === "string" ? resolvedParams.token : undefined;

  let success = false;
  let message = "";

  if (token) {
    const result = await verifyEmailAction(token);
    success = result.success;
    message = result.success 
      ? result.message || "Your email address has been verified successfully. You can now access your account." 
      : result.error || "The email verification link is invalid or has expired.";
  } else {
    message = "Verification token is missing from the request URL.";
  }

  return (
    <div className="w-full text-center">
      <AuthBrandHeader title="Email Verification" />

      <div className="py-4 px-2 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-4">
          {success ? (
            <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
          ) : (
            <XCircle className="w-12 h-12 text-destructive" />
          )}
        </div>
        
        <h3 className={`text-lg font-bold mb-2 ${success ? "text-foreground" : "text-destructive"}`}>
          {success ? "Verification Successful" : "Verification Failed"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
          {message}
        </p>

        <Link
          href={success ? "/login" : "/register"}
          className="inline-block w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/95 shadow-lg shadow-primary/20 active:scale-[0.99] transition-all"
        >
          {success ? "Sign In to Your Account" : "Try Creating an Account Again"}
        </Link>
      </div>
    </div>
  );
}
