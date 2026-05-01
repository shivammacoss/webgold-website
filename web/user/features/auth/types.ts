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

export interface RegisterInput {
  full_name: string;
  email: string;
  phone: string | null;
  password: string;
  referral_code: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}
