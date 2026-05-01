"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, StatCard } from "@/components/ui/card";
import { useAdminStats } from "@/features/dashboard/api/get-stats";
import { useGoldRate } from "@/features/gold/api/get-rate";
import { RateHistoryChart } from "@/features/gold/components/rate-history-chart";
import { formatGrams, formatINR } from "@/lib/utils";

export default function DashboardPage() {
  const { data: stats } = useAdminStats();
  const { data: rate } = useGoldRate();

  return (
    <div>
      <PageHeader title="Overview" subtitle="Platform-wide stats and live gold rate." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={stats?.total_users ?? "—"} />
        <StatCard
          label="INR locked"
          value={stats ? formatINR(stats.total_inr_locked, { compact: true }) : "—"}
        />
        <StatCard
          label="Gold held"
          value={stats ? formatGrams(stats.total_gold_grams) : "—"}
        />
        <StatCard
          label="Active FDs"
          value={stats?.active_fds ?? "—"}
          hint={stats ? `${stats.matured_fds} matured` : undefined}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard
          label="Live INR/g"
          value={rate ? formatINR(rate.inr_per_gram) : "—"}
          hint={rate ? `Source: ${rate.source}` : undefined}
        />
        <StatCard
          label="Buy spread"
          value={rate ? formatINR(rate.buy_inr_per_gram) : "—"}
        />
        <StatCard
          label="Sell spread"
          value={rate ? formatINR(rate.sell_inr_per_gram) : "—"}
        />
      </div>

      <Card>
        <h2 className="mb-4 font-display text-xl font-light">Gold rate · last 30 days</h2>
        <RateHistoryChart range="1m" />
      </Card>
    </div>
  );
}
