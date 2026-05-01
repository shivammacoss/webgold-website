"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

import type { Wallet } from "../types";

interface RazorpayOrderOut {
  order_id: string;
  amount: number; // paise
  currency: string;
  key_id: string;
  receipt: string;
}

interface RazorpayVerifyIn {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount_inr: number;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open(): void;
      on(event: string, cb: (resp: unknown) => void): void;
    };
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;       // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
  handler: (resp: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Create a Razorpay order on the backend. Returns what Checkout needs. */
export function useCreateRazorpayOrder() {
  return useMutation({
    mutationFn: (amount_inr: number) =>
      api<RazorpayOrderOut>("/wallet/deposit/razorpay/order", {
        method: "POST",
        body: JSON.stringify({ amount_inr }),
      }),
  });
}

/** Verify the Razorpay signature server-side and credit the wallet. */
export function useVerifyRazorpayPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RazorpayVerifyIn) =>
      api<Wallet>("/wallet/deposit/razorpay/verify", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    // Use the response directly — the balance card refreshes instantly,
    // no refetch round-trip needed.
    onSuccess: (wallet) => {
      qc.setQueryData(["wallet"], wallet);
      qc.invalidateQueries({ queryKey: ["wallet", "txns"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

/** Promise-wrapped Razorpay Checkout. Resolves with the handler response on
 *  success, rejects with `"dismissed"` when the user closes the modal. */
export function openRazorpayCheckout(
  order: RazorpayOrderOut,
  prefill?: { email?: string; name?: string; contact?: string },
): Promise<RazorpayHandlerResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.Razorpay) {
      return reject(
        new Error("Razorpay Checkout failed to load — check your network"),
      );
    }
    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: "mysafeGold",
      description: "Wallet deposit",
      order_id: order.order_id,
      prefill,
      theme: { color: "#E5B547" },
      handler: (resp) => resolve(resp),
      modal: {
        ondismiss: () => reject(new Error("dismissed")),
      },
    });
    rzp.open();
  });
}
