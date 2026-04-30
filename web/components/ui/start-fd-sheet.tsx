"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "./button";
import { Input } from "./input";
import { useFDPlans, useStartFD, useWallet } from "@/lib/queries";
import { cn, formatGrams } from "@/lib/utils";

export function StartFDSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: plans } = useFDPlans();
  const { data: wallet } = useWallet();
  const start = useStartFD();

  const [planId, setPlanId] = useState<number | null>(null);
  const [grams, setGrams] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const plan = plans?.find((p) => p.id === planId);
  const principal = parseFloat(grams) || 0;
  const projected = plan
    ? principal * (1 + (plan.apr_pct / 100) * (plan.lock_in_days / 365))
    : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) return;
    setErr(null);
    try {
      await start.mutateAsync({ plan_id: planId, grams: principal });
      setGrams("");
      setPlanId(null);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "FD start failed");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-brand-bg p-6 md:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display font-light text-2xl">Start a Gold FD</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans?.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
                  planId === p.id
                    ? "border-brand-gold bg-brand-gold/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20",
                )}
              >
                <span className="text-xs uppercase tracking-wider text-brand-fg/60">
                  {p.lock_in_days}d
                </span>
                <span className="font-display font-light text-2xl">{p.apr_pct}%</span>
                <span className="text-xs text-brand-fg/60">
                  min {formatGrams(p.min_grams)}
                </span>
              </button>
            ))}
          </div>

          <Input
            type="number"
            step="0.001"
            min="0"
            placeholder="Grams to lock"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1 rounded-2xl bg-white/[0.03] p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-fg/60">Available gold</span>
              <span>{wallet ? formatGrams(wallet.gold_grams) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-fg/60">Projected payout</span>
              <span className="font-display font-light text-lg">{formatGrams(projected)}</span>
            </div>
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}
          <Button
            type="submit"
            disabled={start.isPending || !plan || principal <= 0}
            size="lg"
            variant="gold"
          >
            {start.isPending ? "Locking…" : "Lock in gold"}
          </Button>
        </form>
      </div>
    </div>
  );
}
