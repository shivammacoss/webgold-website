import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-brand-surface/80 p-6 backdrop-blur-sm",
        "transition-colors hover:border-white/[0.12]",
        className,
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-brand-fg-dim">
        {label}
      </span>
      <span className="font-display text-4xl font-light tabular-nums tracking-tight-display text-brand-fg md:text-5xl">
        {value}
      </span>
      {hint && (
        <span className="text-sm tabular-nums text-brand-fg-dim">{hint}</span>
      )}
    </Card>
  );
}
