"use client";

import { CheckCircle2, Landmark, Smartphone, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/features/gold/store/currency-store";
import { cn } from "@/lib/utils";

import { useWithdraw, type WithdrawMethod } from "../api/withdraw";

export function WithdrawSheet({
  open,
  onClose,
  maxInr,
}: {
  open: boolean;
  onClose: () => void;
  maxInr: number;
}) {
  const withdraw = useWithdraw();
  const { currency, formatMoney, usdInr, symbol } = useCurrency();

  const [step, setStep] = useState<"amount" | "method" | "details" | "done">(
    "amount",
  );
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawMethod>("UPI");
  const [upiId, setUpiId] = useState("");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const userValue = parseFloat(amount) || 0;
  const inrAmount = currency === "USD" ? userValue * usdInr : userValue;

  const reset = () => {
    setStep("amount");
    setAmount("");
    setMethod("UPI");
    setUpiId("");
    setHolder("");
    setAccount("");
    setIfsc("");
    setErr(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const goToMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (inrAmount <= 0) return setErr("Enter an amount greater than 0");
    if (inrAmount > maxInr)
      return setErr(`Amount exceeds your wallet balance (${formatMoney(maxInr)})`);
    setStep("method");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await withdraw.mutateAsync({
        amount_inr: inrAmount,
        method,
        upi_id: method === "UPI" ? upiId.trim() : null,
        account_holder: method === "BANK_TRANSFER" ? holder.trim() : null,
        account_number: method === "BANK_TRANSFER" ? account.trim() : null,
        ifsc: method === "BANK_TRANSFER" ? ifsc.trim() : null,
      });
      setStep("done");
      setTimeout(close, 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "withdraw failed");
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-brand-bg p-6 md:rounded-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-light">Withdraw</h2>
            <p className="mt-1 text-xs text-brand-fg-dim">
              {step === "amount" && `Available: ${formatMoney(maxInr)}`}
              {step === "method" && "Where should we send the funds?"}
              {step === "details" &&
                (method === "UPI" ? "UPI destination" : "Bank account details")}
              {step === "done" && "Payout queued"}
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-full p-2 text-brand-fg-dim hover:bg-white/5 hover:text-brand-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Stepper step={step} />

        {step === "amount" && (
          <form onSubmit={goToMethod} className="mt-6 flex flex-col gap-4">
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder={`Amount in ${symbol}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            <div className="flex flex-col gap-1 rounded-2xl bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-fg/60">You'll receive</span>
                <span className="font-display text-lg font-light">
                  {formatMoney(inrAmount)}
                </span>
              </div>
              <p className="mt-1 text-xs text-brand-fg/40">
                Payouts go through RazorpayX. Test mode — no real bank movement.
              </p>
            </div>
            {err && <p className="text-xs text-red-400">{err}</p>}
            <Button type="submit" size="lg" variant="gold" disabled={inrAmount <= 0}>
              Continue
            </Button>
          </form>
        )}

        {step === "method" && (
          <div className="mt-6 flex flex-col gap-2">
            {(
              [
                { id: "UPI", label: "UPI", hint: "Instant transfer to any UPI ID", Icon: Smartphone },
                {
                  id: "BANK_TRANSFER",
                  label: "Bank account",
                  hint: "NEFT / IMPS to a bank account",
                  Icon: Landmark,
                },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMethod(m.id);
                  setStep("details");
                }}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left transition-colors hover:border-brand-gold/40 hover:bg-brand-gold/[0.04]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                  <m.Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{m.label}</p>
                  <p className="text-xs text-brand-fg/55">{m.hint}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStep("amount")}
              className="mt-2 self-start text-xs text-brand-fg/50 hover:text-brand-fg"
            >
              ← Change amount
            </button>
          </div>
        )}

        {step === "details" && (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            {method === "UPI" ? (
              <Input
                type="text"
                placeholder="yourname@paytm"
                autoComplete="off"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                autoFocus
              />
            ) : (
              <>
                <Input
                  type="text"
                  placeholder="Account holder name"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value)}
                  required
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Account number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                />
                <Input
                  type="text"
                  placeholder="IFSC (e.g. HDFC0001234)"
                  autoComplete="off"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  maxLength={11}
                  required
                />
              </>
            )}

            <div className="flex flex-col gap-1 rounded-2xl bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-fg/60">Amount</span>
                <span>{formatMoney(inrAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-fg/60">To</span>
                <span>{method === "UPI" ? "UPI" : "Bank account"}</span>
              </div>
              <p className="mt-1 text-xs text-brand-fg/40">
                Simulated — no real bank movement in dev.
              </p>
            </div>

            {err && <p className="text-xs text-red-400">{err}</p>}

            <div className="mt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("method")}
                className="text-xs text-brand-fg/50 hover:text-brand-fg"
              >
                ← Change method
              </button>
              <Button type="submit" disabled={withdraw.isPending} variant="gold" size="md">
                {withdraw.isPending ? "Processing…" : `Withdraw ${formatMoney(inrAmount)}`}
              </Button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="mt-10 flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-display text-2xl font-light">Payout queued</p>
            <p className="text-sm text-brand-fg/70">
              {formatMoney(inrAmount)} will reach your{" "}
              {method === "UPI" ? "UPI ID" : "bank account"} shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: "amount" | "method" | "details" | "done" }) {
  const steps = ["amount", "method", "details", "done"] as const;
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-1">
      {steps.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= idx ? "bg-brand-gold" : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}
