"use client";

import React, { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { ArrowRight, Loader2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus(null);
    startTransition(async () => {
      const res = await subscribeToNewsletter(email);
      if (res.success) {
        setStatus({
          success: true,
          message: res.message || "You're subscribed.",
        });
        setEmail("");
      } else {
        setStatus({
          success: false,
          message: res.error || "Something went wrong.",
        });
      }
    });
  };

  return (
    <div className="w-full">
      <p className="mb-4 text-sm leading-relaxed text-[var(--ln-muted)]">
        Occasional notes on reliability, audits, and shipping calm software.
      </p>

      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          disabled={isPending}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-[var(--ln-radius-sm)] border border-[var(--ln-line-strong)] bg-[var(--ln-bg)] px-3 text-sm text-[var(--ln-ink)] outline-none transition-colors placeholder:text-[var(--ln-faint)] focus:border-[var(--ln-ink)]/30"
        />
        <button
          type="submit"
          disabled={isPending}
          title="Subscribe"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-white transition-colors hover:bg-[var(--ln-ink-soft)] disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
        </button>
      </form>

      {status && (
        <p
          className={`mt-2.5 text-xs ${
            status.success ? "text-[var(--ln-signal-ink)]" : "text-[var(--ln-alert)]"
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
