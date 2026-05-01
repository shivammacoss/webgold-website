"use client";

import { Coins, TrendingUp } from "lucide-react";
import { useState } from "react";

import { SectionHero } from "@/components/common/section-hero";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { useFDs } from "@/features/fd/api/get-fds";
import { useFDPlans } from "@/features/fd/api/get-plans";
import { FDCard } from "@/features/fd/components/fd-card";
import { StartFDSheet } from "@/features/fd/components/start-fd-sheet";
import { useCurrency } from "@/features/gold/store/currency-store";
import { usePortfolio } from "@/features/portfolio/api/get-portfolio";
import { formatGrams } from "@/lib/utils";

export default function PortfolioPage() {
  const { data: portfolio } = usePortfolio();
  const { data: fds } = useFDs();
  const { data: plans } = useFDPlans();
  const { formatMoney } = useCurrency();
  const [fdOpen, setFdOpen] = useState(false);

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

      {/* Available FD plans (admin-managed). Always visible so the user
          knows what they can lock into, even before starting their first FD. */}
      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-light text-2xl">Available FD plans</h2>
            <p className="mt-1 text-sm text-brand-fg/60">
              Lock in your gold for a fixed term and earn extra grams at maturity.
            </p>
          </div>
          {plans && plans.length > 0 && (
            <Button variant="gold" size="sm" onClick={() => setFdOpen(true)}>
              <Coins className="h-3.5 w-3.5" />
              Start an FD
            </Button>
          )}
        </div>

        {!plans ? (
          <p className="text-sm text-brand-fg/60">Loading plans…</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-brand-fg/60">
            No plans available right now. Check back soon.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const projectedReturn =
                ((p.apr_pct / 100) * (p.lock_in_days / 365)) * 100;
              return (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.16]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-brand-fg-dim">
                        {p.lock_in_days}-day lock-in
                      </p>
                      <p className="mt-1 font-display text-lg font-light leading-tight">
                        {p.name}
                      </p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-brand-gold/70" />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-light tabular-nums text-brand-gold">
                      {p.apr_pct}%
                    </span>
                    <span className="text-xs text-brand-fg-dim">APR</span>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-brand-fg/60">
                    <span>Min lock: {formatGrams(p.min_grams)}</span>
                    <span>
                      Earn ~{projectedReturn.toFixed(2)}% extra over the term
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFdOpen(true)}
                    className="mt-1 self-start"
                  >
                    Start with this plan
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 font-display font-light text-2xl">Active Gold FDs</h2>
        {!fds || fds.length === 0 ? (
          <p className="text-sm text-brand-fg/60">
            No FDs yet. Pick a plan above and click <strong>Start with this plan</strong>{" "}
            (or use the <strong>Start an FD</strong> button on the Home tab).
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {fds.map((fd) => <FDCard key={fd.id} fd={fd} />)}
          </ul>
        )}
      </Card>

      <StartFDSheet open={fdOpen} onClose={() => setFdOpen(false)} />
    </div>
  );
}
