export interface GoldRate {
  inr_per_gram: number;
  buy_inr_per_gram: number;
  sell_inr_per_gram: number;
  usd_per_gram: number;
  buy_usd_per_gram: number;
  sell_usd_per_gram: number;
  usd_inr: number;
  /** INR per 1 unit of each currency. Includes "INR": 1.0. */
  fx: Record<string, number>;
  fetched_at: string;
  source: string;
}

export interface GoldRatePoint {
  inr_per_gram: number;
  fetched_at: string;
}

export type RateRange = "1d" | "1w" | "1m" | "1y";
