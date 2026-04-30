import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number, opts: { compact?: boolean } = {}): string {
  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    notation: opts.compact ? "compact" : "standard",
  });
  return fmt.format(amount);
}

export function formatGrams(grams: number): string {
  if (grams === 0) return "0 g";
  if (grams < 0.01) return `${(grams * 1000).toFixed(0)} mg`;
  return `${grams.toFixed(grams < 1 ? 4 : 3)} g`;
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
