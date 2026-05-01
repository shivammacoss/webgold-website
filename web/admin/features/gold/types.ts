export interface AdminGoldRate {
  inr_per_gram: number;
  buy_inr_per_gram: number;
  sell_inr_per_gram: number;
  usd_inr: number;
  fetched_at: string;
  source: string;
}

export interface AdminGoldRatePoint {
  inr_per_gram: number;
  fetched_at: string;
}
