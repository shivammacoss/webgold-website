"use client";

/** Single source of truth for Razorpay Checkout types.
 *
 * Both the wallet-deposit and buy-gold flows use Razorpay, so they previously
 * each `declare global { interface Window { Razorpay: ... } }` — TypeScript
 * rejects two declarations with non-identical shapes. Centralising it here
 * fixes that and keeps the API surface consistent.
 */

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
  handler: (resp: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}
