"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = document.cookie
      .split("; ")
      .find((row) => row.startsWith("healthmesh-cookie-consent="));
    if (!consent) setShow(true);
  }, []);

  const handleConsent = (value: "accepted" | "declined") => {
    const d = new Date();
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = `healthmesh-cookie-consent=${value};expires=${d.toUTCString()};path=/`;
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md rounded-[var(--ln-radius)] border border-[var(--ln-line)] bg-[var(--ln-surface)] p-5 shadow-[var(--ln-shadow)] md:left-auto md:right-6 md:bottom-6"
        >
          <p className="text-sm font-medium text-[var(--ln-ink)]">Cookies</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--ln-muted)]">
            We use non-essential cookies to understand traffic. Read the{" "}
            <Link href="/cookies" className="underline underline-offset-2">
              cookie policy
            </Link>
            .
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => handleConsent("accepted")}
              className="h-9 flex-1 rounded-[var(--ln-radius-sm)] bg-[var(--ln-ink)] text-xs font-medium text-white hover:bg-[var(--ln-ink-soft)]"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => handleConsent("declined")}
              className="h-9 flex-1 rounded-[var(--ln-radius-sm)] border border-[var(--ln-line-strong)] text-xs font-medium text-[var(--ln-ink)] hover:bg-[var(--ln-bg)]"
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
