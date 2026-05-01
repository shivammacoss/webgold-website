export interface Wallet {
  inr_balance: number;
  gold_grams: number;
  updated_at: string;
}

export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAW"
  | "BUY_GOLD"
  | "SELL_GOLD"
  | "FD_LOCK"
  | "FD_PAYOUT"
  | "FD_BREAK"
  | "REFERRAL_BONUS";

export interface Transaction {
  id: number;
  type: TransactionType;
  amount_inr: number;
  gold_grams: number;
  rate_inr_per_gram: number | null;
  status: string;
  note: string | null;
  created_at: string;
}
