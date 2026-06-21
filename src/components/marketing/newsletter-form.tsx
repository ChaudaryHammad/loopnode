"use client";

import React, { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { Loader2, Send } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus(null);
    startTransition(async () => {
      const res = await subscribeToNewsletter(email);
      if (res.success) {
        setStatus({ success: true, message: res.message || "Subscribed successfully!" });
        setEmail("");
      } else {
        setStatus({ success: false, message: res.error || "Subscription failed." });
      }
    });
  };

  return (
    <div className="w-full max-w-sm">
      <h4 className="text-sm font-semibold text-foreground mb-3">
        Subscribe to our newsletter
      </h4>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Get weekly tips on website optimization, SEO, and security audits directly to your inbox.
      </p>
      
      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="email@example.com"
          value={email}
          disabled={isPending}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-secondary/30 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          title="Subscribe"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {status && (
        <p className={`text-xs mt-2.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200 ${
          status.success ? "text-green-500" : "text-destructive"
        }`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
