import React from "react";
import Link from "next/link";
import { unsubscribeFromNewsletter } from "@/actions/newsletter";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Unsubscribe",
};

export default async function NewsletterUnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <UnsubscribeResult
        success={false}
        message="Missing unsubscribe token. Use the link from your newsletter email."
      />
    );
  }

  const result = await unsubscribeFromNewsletter(token);

  return (
    <UnsubscribeResult
      success={result.success}
      message={result.success ? result.message! : result.error ?? "Unsubscribe failed."}
    />
  );
}

function UnsubscribeResult({ success, message }: { success: boolean; message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ln-faint)]">
          Newsletter
        </p>
        <h1 className="mt-4 font-display text-3xl font-medium text-[var(--ln-ink)]">
          {success ? "Unsubscribed" : "Unable to unsubscribe"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ln-muted)]">{message}</p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] px-5 text-sm font-medium text-white hover:bg-[var(--ln-ink-soft)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
