import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing auth-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 ln-grid-bg opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,122,111,0.10),transparent_58%)]" />

      <div className="relative z-10 w-full max-w-[420px] rounded-[var(--ln-radius-lg)] border border-[var(--ln-line)] bg-[var(--ln-surface)] p-8 shadow-[var(--ln-shadow)] sm:p-10">
        {children}
      </div>
    </div>
  );
}
