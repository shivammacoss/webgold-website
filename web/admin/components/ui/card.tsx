import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-brand-surface/80 p-5",
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
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-fg-dim">
        {label}
      </span>
      <span className="font-display text-3xl font-light tabular-nums text-brand-fg">
        {value}
      </span>
      {hint && <span className="text-xs text-brand-fg-dim">{hint}</span>}
    </Card>
  );
}
