"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { Wallet } from "@/features/wallet/types";

interface RzpOrderOut {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  receipt: string;
}

interface RzpVerifyIn {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount_inr: number;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open(): void;
    };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
  handler: (resp: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

export function useCreateBuyGoldRazorpayOrder() {
  return useMutation({
    mutationFn: (amount_inr: number) =>
      api<RzpOrderOut>("/invest/gold/buy/razorpay/order", {
        method: "POST",
        body: JSON.stringify({ amount_inr }),
      }),
  });
}

export function useVerifyBuyGoldRazorpayPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RzpVerifyIn) =>
      api<Wallet>("/invest/gold/buy/razorpay/verify", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    // Push the updated wallet straight into the cache so the gold balance
    // ticks up the instant Razorpay returns — no refetch round-trip.
    onSuccess: (wallet) => {
      qc.setQueryData(["wallet"], wallet);
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

/** Promise-wrapped Razorpay Checkout for the buy-gold flow. */
export function openRazorpayForBuy(
  order: RzpOrderOut,
  prefill?: { email?: string; name?: string; contact?: string },
): Promise<{
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.Razorpay) {
      return reject(new Error("Razorpay Checkout failed to load"));
    }
    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "mysafeGold",
      description: "Buy gold",
      order_id: order.order_id,
      prefill,
      theme: { color: "#E5B547" },
      handler: (resp) => resolve(resp),
      modal: { ondismiss: () => reject(new Error("dismissed")) },
    });
    rzp.open();
  });
}
