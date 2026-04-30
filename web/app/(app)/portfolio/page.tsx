"use client";

import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHero } from "@/components/ui/section-hero";
import { useCurrency } from "@/lib/currency";
import { useBreakFD, useFDs, usePortfolio } from "@/lib/queries";
import { daysBetween, formatGrams } from "@/lib/utils";

export default function PortfolioPage() {
  const { data: portfolio } = usePortfolio();
  const { data: fds } = useFDs();
  const breakFD = useBreakFD();
  const { formatMoney } = useCurrency();

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHero
        eyebrow="Holdings"
        title="Portfolio."
        subtitle="Your gold, your fixed deposits, your gains — all in one view."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total gold"
          value={portfolio ? formatGrams(portfolio.gold_grams) : "—"}
          hint={portfolio ? `incl. ${formatGrams(portfolio.locked_grams)} in FDs` : undefined}
        />
        <StatCard
          label="Gold value"
          value={portfolio ? formatMoney(portfolio.gold_value_inr, { compact: true }) : "—"}
        />
        <StatCard
          label="Invested"
          value={portfolio ? formatMoney(portfolio.invested_inr, { compact: true }) : "—"}
        />
        <StatCard
          label="P&L"
          value={
            portfolio ? (
              <span className={portfolio.pnl_inr >= 0 ? "text-emerald-400" : "text-red-400"}>
                {portfolio.pnl_inr >= 0 ? "+" : ""}
                {portfolio.pnl_pct.toFixed(2)}%
              </span>
            ) : "—"
          }
          hint={portfolio ? formatMoney(portfolio.pnl_inr) : undefined}
        />
      </div>

      <Card>
        <h2 className="mb-4 font-display font-light text-2xl">Active Gold FDs</h2>
        {!fds || fds.length === 0 ? (
          <p className="text-sm text-brand-fg/60">No FDs yet. Start one from the Home tab.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {fds.map((fd) => {
              const daysLeft = daysBetween(new Date(), fd.maturity_date);
              return (
                <li
                  key={fd.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
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
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
