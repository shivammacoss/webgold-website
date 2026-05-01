"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useGoldRate } from "../api/get-gold-rate";

/** Major gold-market currencies the user can pick from. */
export const CURRENCIES = [
  { code: "INR", symbol: "₹", flag: "🇮🇳", name: "Indian Rupee",      locale: "en-IN" },
  { code: "USD", symbol: "$", flag: "🇺🇸", name: "US Dollar",          locale: "en-US" },
  { code: "EUR", symbol: "€", flag: "🇪🇺", name: "Euro",               locale: "de-DE" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", name: "British Pound",      locale: "en-GB" },
  { code: "AED", symbol: "AED", flag: "🇦🇪", name: "UAE Dirham",       locale: "ar-AE" },
  { code: "CNY", symbol: "¥", flag: "🇨🇳", name: "Chinese Yuan",       locale: "zh-CN" },
  { code: "JPY", symbol: "¥", flag: "🇯🇵", name: "Japanese Yen",       locale: "ja-JP" },
  { code: "CHF", symbol: "Fr", flag: "🇨🇭", name: "Swiss Franc",        locale: "de-CH" },
  { code: "RUB", symbol: "₽", flag: "🇷🇺", name: "Russian Ruble",      locale: "ru-RU" },
  { code: "SAR", symbol: "SAR", flag: "🇸🇦", name: "Saudi Riyal",       locale: "ar-SA" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

/** Static fallback used until /gold/rate has loaded. INR per 1 unit. */
const FX_FALLBACK: Record<CurrencyCode, number> = {
  INR: 1.0, USD: 85.0, EUR: 92.0, GBP: 110.0, JPY: 0.55,
  CNY: 11.7, AED: 23.1, CHF: 95.0, RUB: 1.05, SAR: 22.6,
};

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "INR",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "msg_currency" },
  ),
);

export function useCurrency() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const { data: rate } = useGoldRate();
  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const inrPer = rate?.fx?.[currency] ?? FX_FALLBACK[currency];

  const formatMoney = (
    inrAmount: number,
    opts: { compact?: boolean; signed?: boolean } = {},
  ) => {
    const value = inrAmount / inrPer;
    const fmt = new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" || currency === "RUB" ? 0 : 2,
      notation: opts.compact ? "compact" : "standard",
      signDisplay: opts.signed ? "always" : "auto",
    });
    return fmt.format(value);
  };

  const convert = (inr: number) => inr / inrPer;
  const toInr = (display: number) => display * inrPer;

  return {
    currency,
    setCurrency,
    symbol: meta.symbol,
    flag: meta.flag,
    name: meta.name,
    locale: meta.locale,
    inrPer,
    usdInr: rate?.fx?.USD ?? FX_FALLBACK.USD,
    formatMoney,
    convert,
    toInr,
  };
}
