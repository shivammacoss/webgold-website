export interface AdminFD {
  id: string;
  user_id: string;
  user_email?: string;
  plan_name: string;
  principal_grams: number;
  apr_pct: number;
  lock_in_days: number;
  start_date: string;
  maturity_date: string;
  status: "ACTIVE" | "MATURED" | "BROKEN";
  payout_grams: number | null;
}

export interface AdminFDPlan {
  id: string;
  name: string;
  lock_in_days: number;
  apr_pct: number;
  min_grams: number;
}
