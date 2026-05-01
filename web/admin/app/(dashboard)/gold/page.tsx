"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { useGoldRate } from "@/features/gold/api/get-rate";
import { RateHistoryChart } from "@/features/gold/components/rate-history-chart";
import { formatINR } from "@/lib/utils";

export default function GoldPage() {
  const { data: rate } = useGoldRate();

  return (
    <div>
      <PageHeader title="Gold rate" subtitle="Live rate, source health, and history." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="INR per gram"
          value={rate ? formatINR(rate.inr_per_gram) : "—"}
        />
        <StatCard
          label="Buy rate"
          value={rate ? formatINR(rate.buy_inr_per_gram) : "—"}
        />
        <StatCard
          label="Sell rate"
          value={rate ? formatINR(rate.sell_inr_per_gram) : "—"}
        />
        <StatCard
          label="USD/INR"
          value={rate ? rate.usd_inr.toFixed(2) : "—"}
          hint={rate ? `Source: ${rate.source}` : undefined}
        />
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 font-display text-xl font-light">Rate history · 1 month</h2>
        <RateHistoryChart range="1m" />
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-xl font-light">Rate history · 1 year</h2>
        <RateHistoryChart range="1y" />
      </Card>
    </div>
  );
}
