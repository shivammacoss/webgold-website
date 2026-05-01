export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  referral_code: string;
  is_admin?: boolean;
  inr_balance?: number;
  gold_grams?: number;
  active_fds?: number;
  created_at: string;
}

export interface AdminLoginLogRow {
  id: string;
  user_id: string;
  kind: "LOGIN" | "HEARTBEAT" | string;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  geo_source: "BROWSER" | "IP" | "NONE" | null;
  accuracy_m: number | null;
  created_at: string;
}

export interface ImpersonateResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
