"use client";

import { ArrowDown, Coins, ShoppingBag, TrendingUp } from "lucide-react";
import { useState } from "react";

import { SectionHero } from "@/components/common/section-hero";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { useGoldRate } from "@/features/gold/api/get-gold-rate";
import { BuyGoldSheet } from "@/features/gold/components/buy-gold-sheet";
import { GoldChart } from "@/features/gold/components/gold-chart";
import { GoldRateTicker } from "@/features/gold/components/price-card";
import { useCurrency } from "@/features/gold/store/currency-store";
import { useTransactions } from "@/features/wallet/api/get-transactions";
import { useWallet } from "@/features/wallet/api/get-wallet";
import { formatGrams } from "@/lib/utils";

export default function BuyGoldPage() {
  const { data: rate } = useGoldRate();
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions();
  const { formatMoney } = useCurrency();
  const [open, setOpen] = useState(false);

  const recentBuys =
    txns?.filter((t) => t.type === "BUY_GOLD").slice(0, 5) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHero
        eyebrow="Invest"
        title="Buy gold."
        subtitle="Pay directly with UPI, card, or bank transfer — gold lands in your portfolio instantly."
        right={<GoldRateTicker />}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Your gold"
          value={wallet ? formatGrams(wallet.gold_grams) : "—"}
          hint={
            wallet && rate
              ? `≈ ${formatMoney((wallet.gold_grams * rate.inr_per_gram))}`
              : undefined
          }
        />
        <StatCard
          label="Buy rate / g"
          value={rate ? formatMoney(rate.buy_inr_per_gram) : "—"}
        />
        <StatCard
          label="Sell rate / g"
          value={rate ? formatMoney(rate.sell_inr_per_gram) : "—"}
        />
      </div>

      <Card className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand-fg/60">
            <ShoppingBag className="h-4 w-4" />
            <span className="font-medium text-[10px] uppercase tracking-[0.2em]">
              Buy at the live rate
            </span>
          </div>
          <p className="font-display text-3xl font-light leading-tight tracking-tight-display">
            Pay direct. No wallet balance needed.
          </p>
          <p className="mt-2 max-w-md text-sm text-brand-fg/60">
            Choose UPI, card, bank transfer, or test mode at checkout — your gold
            credits the moment payment confirms.
          </p>
        </div>
        <Button variant="gold" size="lg" onClick={() => setOpen(true)}>
          <Coins className="h-4 w-4" />
          Buy gold now
        </Button>
      </Card>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium text-[10px] uppercase tracking-[0.2em] text-brand-fg/50">
            <TrendingUp className="mr-1.5 inline h-3 w-3" />
            Rate · last 7 days
          </span>
          <ArrowDown className="h-4 w-4 text-brand-fg/30" />
        </div>
        <GoldChart range="1w" />
      </Card>

      <Card>
        <h2 className="mb-4 font-display font-light text-2xl">Recent purchases</h2>
        {recentBuys.length === 0 ? (
          <p className="text-sm text-brand-fg/60">
            No gold purchases yet. Click <strong>Buy gold now</strong> above to make
            your first one.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {recentBuys.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    Bought {formatGrams(t.gold_grams)}
                    {t.rate_inr_per_gram && (
                      <span className="text-brand-fg/50">
                        {" "}
                        @ {formatMoney(t.rate_inr_per_gram)}/g
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-brand-fg/50">
                    {new Date(t.created_at).toLocaleString()}
                    {t.note && <> · {t.note}</>}
                  </p>
                </div>
                <p className="shrink-0 text-right text-sm font-medium tabular-nums">
                  {formatMoney(t.amount_inr)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <BuyGoldSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
