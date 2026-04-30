"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "./button";
import { Input } from "./input";
import { useCurrency } from "@/lib/currency";
import { useBuyGold, useRate, useWallet } from "@/lib/queries";
import { formatGrams } from "@/lib/utils";

export function BuyGoldSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: rate } = useRate();
  const { data: wallet } = useWallet();
  const buy = useBuyGold();
  const { currency, formatMoney, convert, usdInr, symbol } = useCurrency();

  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // The user types in their display currency. Backend wants INR.
  const userValue = parseFloat(amount) || 0;
  const inrAmount = currency === "USD" ? userValue * usdInr : userValue;
  const grams = rate ? inrAmount / rate.buy_inr_per_gram : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await buy.mutateAsync(inrAmount);
      setAmount("");
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "buy failed");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-brand-bg p-6 md:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display font-light text-2xl">Buy gold</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder={`Amount in ${symbol}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1 rounded-2xl bg-white/[0.03] p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-fg/60">You get</span>
              <span className="font-display font-light text-lg">{formatGrams(grams)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-fg/60">Buy rate</span>
              <span>{rate ? `${formatMoney(rate.buy_inr_per_gram)}/g` : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-fg/60">Wallet balance</span>
              <span>{wallet ? formatMoney(wallet.inr_balance) : "—"}</span>
            </div>
            {currency === "USD" && (
              <div className="flex justify-between text-xs text-brand-fg/40">
                <span>FX</span>
                <span>1 USD = ₹{usdInr.toFixed(2)}</span>
              </div>
            )}
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <Button type="submit" disabled={buy.isPending || inrAmount <= 0} size="lg" variant="gold">
            {buy.isPending ? "Buying…" : `Buy ${formatGrams(grams)}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
