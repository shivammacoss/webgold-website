export interface AdminReferralRow {
  id: string;
  referrer_email: string | null;
  referee_email: string | null;
  bonus_inr: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}
