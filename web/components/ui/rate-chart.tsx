"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useCurrency } from "@/lib/currency";
import { useRateHistory } from "@/lib/queries";

export function RateChart({ range = "1w" as "1d" | "1w" | "1m" | "1y" }) {
  const { data, isLoading } = useRateHistory(range);
  const { currency, convert } = useCurrency();
  const tooltipFmt = (v: number) =>
    new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(v);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-white/[0.03]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] text-sm text-brand-fg/50">
        Rate history will appear here once snapshots accumulate.
      </div>
    );
  }

  const points = data.map((p) => ({
    date: new Date(p.fetched_at).toLocaleDateString(),
    price: convert(p.inr_per_gram),
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              background: "#0A0A0A",
              border: "1px solid rgba(225,224,204,0.15)",
              borderRadius: 12,
              color: "#E1E0CC",
            }}
            formatter={(v: number) => [tooltipFmt(v), "Rate/g"]}
          />
          <Area type="monotone" dataKey="price" stroke="#D4AF37" fill="url(#g)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
