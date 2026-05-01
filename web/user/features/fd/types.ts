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
