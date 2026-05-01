"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useGoldHistory } from "../api/get-rate";

export function RateHistoryChart({ range = "1m" as "1d" | "1w" | "1m" | "1y" }) {
  const { data, isLoading } = useGoldHistory(range);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white/[0.03]" />;
  }
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-brand-fg/50">
        No snapshots yet.
      </div>
    );
  }

  const points = data.map((p) => ({
    date: new Date(p.fetched_at).toLocaleDateString(),
    price: p.inr_per_gram,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="adminGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E5B547" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#E5B547" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#9A958A" fontSize={11} />
          <YAxis stroke="#9A958A" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "#0A0A0A",
              border: "1px solid rgba(245,241,232,0.15)",
              borderRadius: 8,
              color: "#F5F1E8",
            }}
          />
          <Area type="monotone" dataKey="price" stroke="#E5B547" fill="url(#adminGold)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
