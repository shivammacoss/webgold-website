"use client";

import { Banknote, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/features/user/api/get-me";
import { useCurrency } from "@/features/gold/store/currency-store";

import { useDeposit } from "../api/deposit";
import {
  openRazorpayCheckout,
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
} from "../api/razorpay";

export function DepositSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: me } = useMe();
  const { currency, formatMoney, usdInr, symbol } = useCurrency();
  const createOrder = useCreateRazorpayOrder();
  const verify = useVerifyRazorpayPayment();
  const manualDeposit = useDeposit();

  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ inr: number; via: string } | null>(null);

  const userValue = parseFloat(amount) || 0;
  const inrAmount = currency === "USD" ? userValue * usdInr : userValue;

  const reset = () => {
    setAmount("");
    setErr(null);
    setDone(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const payWithRazorpay = async () => {
    setErr(null);
    if (inrAmount <= 0) return setErr("Enter an amount greater than 0");
    try {
      const order = await createOrder.mutateAsync(inrAmount);
      const handler = await openRazorpayCheckout(order, {
        email: me?.email,
        name: me?.full_name,
        contact: me?.phone ?? undefined,
      });
      await verify.mutateAsync({
        razorpay_order_id: handler.razorpay_order_id,
        razorpay_payment_id: handler.razorpay_payment_id,
        razorpay_signature: handler.razorpay_signature,
        amount_inr: inrAmount,
      });
      setDone({ inr: inrAmount, via: "Razorpay" });
      setTimeout(close, 1500);
    } catch (e) {
      if (e instanceof Error && e.message === "dismissed") {
        // user closed the Checkout modal — silent, no error UI
        return;
      }
      setErr(e instanceof Error ? e.message : "payment failed");
    }
  };

  const payManual = async () => {
    setErr(null);
    if (inrAmount <= 0) return setErr("Enter an amount greater than 0");
    try {
      await manualDeposit.mutateAsync({ amount_inr: inrAmount, method: "MANUAL" });
      setDone({ inr: inrAmount, via: "Manual / test" });
      setTimeout(close, 1400);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "deposit failed");
    }
  };

  const pending = createOrder.isPending || verify.isPending || manualDeposit.isPending;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-brand-bg p-6 md:rounded-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-light">Add funds</h2>
            <p className="mt-1 text-xs text-brand-fg-dim">
              {done
                ? "Payment successful."
                : "Pay securely with Razorpay (UPI / Card / Net Banking)."}
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-full p-2 text-brand-fg-dim hover:bg-white/5 hover:text-brand-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="font-display text-2xl font-light">Wallet credited</p>
            <p className="text-sm text-brand-fg/70">
              {formatMoney(done.inr)} added via {done.via}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder={`Amount in ${symbol}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />

            <div className="flex flex-col gap-1 rounded-2xl bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-fg/60">Will credit</span>
                <span className="font-display text-lg font-light">
                  {formatMoney(inrAmount)}
                </span>
              </div>
              {currency === "USD" && (
                <div className="flex justify-between text-xs text-brand-fg/40">
                  <span>FX</span>
                  <span>1 USD = ₹{usdInr.toFixed(2)}</span>
                </div>
              )}
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-brand-fg/50">
                <ShieldCheck className="h-3.5 w-3.5" />
                Razorpay test mode — use UPI ID{" "}
                <span className="font-mono text-brand-fg-dim">success@razorpay</span>{" "}
                or any test card.
              </p>
            </div>

            {err && <p className="text-xs text-red-400">{err}</p>}

            <Button
              type="button"
              onClick={payWithRazorpay}
              disabled={pending || inrAmount <= 0}
              size="lg"
              variant="gold"
            >
              {pending ? "Processing…" : `Pay ${formatMoney(inrAmount)} via Razorpay`}
            </Button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[10px] uppercase tracking-widest text-brand-fg/40">
                or
              </span>
              <span className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <Button
              type="button"
              onClick={payManual}
              disabled={pending || inrAmount <= 0}
              variant="ghost"
              size="md"
            >
              <Banknote className="h-4 w-4" />
              Manual / test (instant credit)
            </Button>
            <p className="-mt-2 text-center text-[10px] text-brand-fg/40">
              Skips the gateway — for development only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
