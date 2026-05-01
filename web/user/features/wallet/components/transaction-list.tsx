"use client";

import { useCurrency } from "@/features/gold/store/currency-store";
import { cn, formatGrams } from "@/lib/utils";

import type { Transaction, TransactionType } from "../types";

const TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
  BUY_GOLD: "Bought gold",
  SELL_GOLD: "Sold gold",
  FD_LOCK: "FD locked",
  FD_PAYOUT: "FD matured",
  FD_BREAK: "FD broken",
  REFERRAL_BONUS: "Referral bonus",
};

export function TransactionList({ items }: { items: Transaction[] | undefined }) {
  const { formatMoney } = useCurrency();

  if (!items || items.length === 0) {
    return <p className="text-sm text-brand-fg/60">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-white/[0.06]">
      {items.map((t) => {
        const isDebit = ["WITHDRAW", "BUY_GOLD", "FD_LOCK"].includes(t.type);
        return (
          <li key={t.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm">{TYPE_LABELS[t.type] ?? t.type}</p>
              <p className="text-xs text-brand-fg/50">
                {new Date(t.created_at).toLocaleString()} · {t.note}
              </p>
            </div>
            <div className="text-right">
              {t.amount_inr > 0 && (
                <p className={cn("font-medium", isDebit ? "text-red-400" : "text-emerald-400")}>
                  {isDebit ? "−" : "+"}
                  {formatMoney(t.amount_inr)}
                </p>
              )}
              {t.gold_grams > 0 && (
                <p className="text-xs text-brand-fg/60">{formatGrams(t.gold_grams)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
