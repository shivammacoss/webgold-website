export interface AdminTransaction {
  id: number;
  user_id: number;
  user_email?: string;
  type: string;
  amount_inr: number;
  gold_grams: number;
  rate_inr_per_gram: number | null;
  status: string;
  note: string | null;
  created_at: string;
}
