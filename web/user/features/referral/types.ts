export interface ReferralEntry {
  referee_email: string;
  bonus_inr: number;
  status: string;
  created_at: string;
}

export interface ReferralSummary {
  code: string;
  total_bonus_inr: number;
  referrals: ReferralEntry[];
}
