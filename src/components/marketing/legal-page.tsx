import React from "react";

export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1">
      <div className="ln-container max-w-3xl py-20 md:py-28">
        <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 font-mono text-xs text-[var(--ln-faint)]">
          Last updated: July 22, 2026
        </p>
        {description ? (
          <p className="mt-6 text-base leading-relaxed text-[var(--ln-muted)]">
            {description}
          </p>
        ) : null}
        <div className="legal-prose mt-12 space-y-10 text-sm leading-relaxed text-[var(--ln-muted)] [&_a]:text-[var(--ln-ink)] [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-[var(--ln-ink)] [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-[var(--ln-ink)] [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:font-medium [&_strong]:text-[var(--ln-ink-soft)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalMailto({ children = "loopenode@gmail.com" }: { children?: string }) {
  return <a href={`mailto:${children}`}>{children}</a>;
}
