export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  referral_code: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

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

export interface Wallet {
  inr_balance: number;
  gold_grams: number;
  updated_at: string;
}

export interface Transaction {
  id: number;
  type:
    | "DEPOSIT" | "WITHDRAW" | "BUY_GOLD" | "SELL_GOLD"
    | "FD_LOCK" | "FD_PAYOUT" | "FD_BREAK" | "REFERRAL_BONUS";
  amount_inr: number;
  gold_grams: number;
  rate_inr_per_gram: number | null;
  status: string;
  note: string | null;
  created_at: string;
}

export interface FDPlan {
  id: number;
  name: string;
  lock_in_days: number;
  apr_pct: number;
  min_grams: number;
}

export interface FD {
  id: number;
  plan_name: string;
  principal_grams: number;
  apr_pct: number;
  lock_in_days: number;
  start_date: string;
  maturity_date: string;
  status: "ACTIVE" | "MATURED" | "BROKEN";
  payout_grams: number | null;
  projected_payout_grams: number;
}

export interface Portfolio {
  gold_grams: number;
  inr_balance: number;
  gold_value_inr: number;
  invested_inr: number;
  pnl_inr: number;
  pnl_pct: number;
  active_fds: number;
  locked_grams: number;
}

export interface ReferralSummary {
  code: string;
  total_bonus_inr: number;
  referrals: {
    referee_email: string;
    bonus_inr: number;
    status: string;
    created_at: string;
  }[];
}
