import React from "react";
import Link from "next/link";
import { HealthMeshLogo } from "@/components/brand/healthmesh-logo";

export function AuthBrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <Link href="/" className="mb-6 inline-flex transition-opacity hover:opacity-80">
        <HealthMeshLogo
          variant="ink"
          markClassName="size-8"
          wordmarkClassName="text-lg text-[var(--ln-ink)]"
        />
      </Link>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--ln-ink)] sm:text-[1.65rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-[var(--ln-muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
