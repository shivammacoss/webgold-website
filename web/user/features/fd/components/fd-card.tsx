"use client";

import { Button } from "@/components/ui/button";
import { daysBetween, formatGrams } from "@/lib/utils";

import { useBreakFD } from "../api/break-fd";
import type { FD } from "../types";

export function FDCard({ fd }: { fd: FD }) {
  const breakFD = useBreakFD();
  const daysLeft = daysBetween(new Date(), fd.maturity_date);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="font-display font-light text-xl">{fd.plan_name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
              fd.status === "ACTIVE"
                ? "bg-emerald-500/20 text-emerald-300"
                : fd.status === "MATURED"
                  ? "bg-brand-gold/20 text-brand-gold"
                  : "bg-white/10 text-brand-fg/60"
            }`}
          >
            {fd.status}
          </span>
        </div>
        <p className="text-sm text-brand-fg/60">
          {formatGrams(fd.principal_grams)} · {fd.apr_pct}% APR · matures{" "}
          {new Date(fd.maturity_date).toLocaleDateString()}
          {fd.status === "ACTIVE" && daysLeft > 0 && ` (${daysLeft} days left)`}
        </p>
        <p className="mt-1 text-xs text-brand-fg/50">
          Projected payout: {formatGrams(fd.projected_payout_grams)}
        </p>
      </div>
      {fd.status === "ACTIVE" && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => breakFD.mutate(fd.id)}
          disabled={breakFD.isPending}
        >
          Break early
        </Button>
      )}
    </li>
  );
}
