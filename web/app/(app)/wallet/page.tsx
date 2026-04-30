"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHero } from "@/components/ui/section-hero";
import { useCurrency } from "@/lib/currency";
import { useDeposit, useTransactions, useWallet, useWithdraw } from "@/lib/queries";
import { cn, formatGrams } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const TYPE_LABELS: Record<Transaction["type"], string> = {
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
  BUY_GOLD: "Bought gold",
  SELL_GOLD: "Sold gold",
  FD_LOCK: "FD locked",
  FD_PAYOUT: "FD matured",
  FD_BREAK: "FD broken",
  REFERRAL_BONUS: "Referral bonus",
};

export default function WalletPage() {
  const { data: wallet } = useWallet();
  const { data: txns } = useTransactions();
  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const { currency, formatMoney, usdInr, symbol } = useCurrency();

  const [depAmount, setDepAmount] = useState("");
  const [wdAmount, setWdAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // Forms accept the user's current display currency; backend wants INR.
  const toInr = (s: string) => {
    const v = parseFloat(s) || 0;
    return currency === "USD" ? v * usdInr : v;
  };

  const onDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await deposit.mutateAsync(toInr(depAmount));
      setDepAmount("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "deposit failed");
    }
  };

  const onWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await withdraw.mutateAsync(toInr(wdAmount));
      setWdAmount("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "withdraw failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHero
        eyebrow="Funds"
        title="Wallet."
        subtitle="Add funds, withdraw, and review every transaction."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label={`${currency} balance`} value={wallet ? formatMoney(wallet.inr_balance) : "—"} />
        <StatCard label="Gold balance" value={wallet ? formatGrams(wallet.gold_grams) : "—"} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display font-light text-xl">Add funds</h2>
          <form onSubmit={onDeposit} className="flex flex-col gap-3">
            <Input
              type="number"
              min="1"
              placeholder={`Amount in ${symbol}`}
              value={depAmount}
              onChange={(e) => setDepAmount(e.target.value)}
              required
            />
            <Button type="submit" disabled={deposit.isPending} variant="gold">
              {deposit.isPending ? "Adding…" : "Deposit"}
            </Button>
            <p className="text-xs text-brand-fg/40">
              Simulated deposit — no real money changes hands.
            </p>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-display font-light text-xl">Withdraw</h2>
          <form onSubmit={onWithdraw} className="flex flex-col gap-3">
            <Input
              type="number"
              min="1"
              placeholder={`Amount in ${symbol}`}
              value={wdAmount}
              onChange={(e) => setWdAmount(e.target.value)}
              required
            />
            <Button type="submit" disabled={withdraw.isPending} variant="outline">
              {withdraw.isPending ? "Withdrawing…" : "Withdraw"}
            </Button>
          </form>
        </Card>
      </div>

      {err && <p className="mb-4 text-sm text-red-400">{err}</p>}

      <Card>
        <h2 className="mb-4 font-display font-light text-2xl">Activity</h2>
        {!txns || txns.length === 0 ? (
          <p className="text-sm text-brand-fg/60">No activity yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/[0.06]">
            {txns.map((t) => {
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
        )}
      </Card>
    </div>
  );
}
