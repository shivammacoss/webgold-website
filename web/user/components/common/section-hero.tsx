"use client";

import { cn } from "@/lib/utils";

interface SectionHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHero({
  eyebrow,
  title,
  subtitle,
  right,
  className,
}: SectionHeroProps) {
  return (
    <header
      className={cn(
        "relative mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="animate-fade-up">
        {eyebrow && (
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-tight-display text-brand-fg md:text-7xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-fg-dim md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0 animate-fade-up [animation-delay:120ms]">{right}</div>}
    </header>
  );
}
