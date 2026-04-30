import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { useRate } from "./queries";

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

const FX_FALLBACK: Record<CurrencyCode, number> = {
  INR: 1.0, USD: 85.0, EUR: 92.0, GBP: 110.0, JPY: 0.55,
  CNY: 11.7, AED: 23.1, CHF: 95.0, RUB: 1.05, SAR: 22.6,
};

const STORE_KEY = "msg_currency";

/** SecureStore-backed Zustand-equivalent. Exposed as a plain hook so screens
 * can call `const { currency, setCurrency, formatMoney } = useCurrency()`
 * exactly like on web. */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");
  const { data: rate } = useRate();

  // Hydrate the saved choice on mount.
  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY).then((v) => {
      if (v && CURRENCIES.some((c) => c.code === v)) {
        setCurrencyState(v as CurrencyCode);
      }
    });
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    SecureStore.setItemAsync(STORE_KEY, c).catch(() => {});
  }, []);

  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  const inrPer = rate?.fx?.[currency] ?? FX_FALLBACK[currency];

  const formatMoney = useCallback(
    (inrAmount: number, opts: { compact?: boolean } = {}) => {
      const value = inrAmount / inrPer;
      const fmt = new Intl.NumberFormat(meta.locale, {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "JPY" || currency === "RUB" ? 0 : 2,
        notation: opts.compact ? "compact" : "standard",
      });
      return fmt.format(value);
    },
    [currency, inrPer, meta.locale],
  );

  const toInr = useCallback((display: number) => display * inrPer, [inrPer]);

  return {
    currency,
    setCurrency,
    symbol: meta.symbol,
    flag: meta.flag,
    name: meta.name,
    inrPer,
    usdInr: rate?.fx?.USD ?? FX_FALLBACK.USD,
    formatMoney,
    toInr,
  };
}
