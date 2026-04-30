"use client";

import { ArrowDown, ArrowUp, Coins } from "lucide-react";
import { useState } from "react";

import { BuyGoldSheet } from "@/components/ui/buy-gold-sheet";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { GoldRateTicker } from "@/components/ui/gold-rate-ticker";
import { RateChart } from "@/components/ui/rate-chart";
import { SectionHero } from "@/components/ui/section-hero";
import { StartFDSheet } from "@/components/ui/start-fd-sheet";
import { useCurrency } from "@/lib/currency";
import { useMe, usePortfolio, useRate } from "@/lib/queries";
import { formatGrams } from "@/lib/utils";

export default function HomePage() {
  const { data: me } = useMe();
  const { data: portfolio } = usePortfolio();
  const { data: rate } = useRate();
  const { formatMoney, currency } = useCurrency();
  const [buyOpen, setBuyOpen] = useState(false);
  const [fdOpen, setFdOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHero
        eyebrow="Dashboard"
        title={me ? `Welcome back, ${me.full_name.split(" ")[0]}.` : "Welcome."}
        subtitle="Live gold pricing. Two taps to invest."
        right={<GoldRateTicker />}
      />

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Gold balance"
          value={portfolio ? formatGrams(portfolio.gold_grams) : "—"}
          hint={portfolio ? `≈ ${formatMoney(portfolio.gold_value_inr)}` : undefined}
        />
        <StatCard
          label={`${currency} balance`}
          value={portfolio ? formatMoney(portfolio.inr_balance) : "—"}
        />
        <StatCard
          label="P&L"
          value={
            portfolio ? (
              <span className={portfolio.pnl_inr >= 0 ? "text-emerald-400" : "text-red-400"}>
                {portfolio.pnl_inr >= 0 ? "+" : ""}
                {formatMoney(portfolio.pnl_inr)}
              </span>
            ) : "—"
          }
          hint={portfolio ? `${portfolio.pnl_pct.toFixed(2)}%` : undefined}
        />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-fg/60">
              <ArrowUp className="h-4 w-4" />
              <span className="font-medium text-[10px] uppercase tracking-[0.2em]">Buy gold</span>
            </div>
            <p className="font-display text-3xl font-light leading-tight tracking-tight-display">
              Live rate, instant settlement.
            </p>
            <p className="mt-2 text-sm text-brand-fg/60">
              Buy from as little as {formatMoney(10)} at {rate ? `${formatMoney(rate.buy_inr_per_gram)}/g` : "—"}.
            </p>
          </div>
          <Button variant="gold" size="lg" onClick={() => setBuyOpen(true)}>
            Buy gold now
          </Button>
        </Card>

        <Card className="flex flex-col justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-brand-fg/60">
              <Coins className="h-4 w-4" />
              <span className="font-medium text-[10px] uppercase tracking-[0.2em]">Gold FD</span>
            </div>
            <p className="font-display text-3xl font-light leading-tight tracking-tight-display">
              Lock in. Earn extra grams.
            </p>
            <p className="mt-2 text-sm text-brand-fg/60">
              Plans from 90 days at 4.5% APR up to 365 days at 7% APR.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => setFdOpen(true)}>
            Start a Gold FD
          </Button>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium text-[10px] uppercase tracking-[0.2em] text-brand-fg/50">
            Rate · last 7 days
          </span>
          <ArrowDown className="h-4 w-4 text-brand-fg/30" />
        </div>
        <RateChart range="1w" />
      </Card>

      <BuyGoldSheet open={buyOpen} onClose={() => setBuyOpen(false)} />
      <StartFDSheet open={fdOpen} onClose={() => setFdOpen(false)} />
    </div>
  );
}
