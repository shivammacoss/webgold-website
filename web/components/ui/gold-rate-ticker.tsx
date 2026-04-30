"use client";

import { motion } from "framer-motion";

import { useCurrency } from "@/lib/currency";
import { useRate } from "@/lib/queries";

export function GoldRateTicker() {
  const { data, isLoading } = useRate();
  const { formatMoney } = useCurrency();

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-brand-fg-dim">
        Live 24K · per gram
      </span>
      <motion.div
        key={data?.fetched_at ?? "loading"}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-5xl font-light tabular-nums tracking-tight-display text-brand-fg md:text-6xl"
      >
        {isLoading || !data ? "—" : formatMoney(data.inr_per_gram)}
      </motion.div>
      {data && (
        <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs tabular-nums text-brand-fg-dim">
          <span>Buy {formatMoney(data.buy_inr_per_gram)}</span>
          <span>Sell {formatMoney(data.sell_inr_per_gram)}</span>
        </div>
      )}
    </div>
  );
}
