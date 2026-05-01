export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  is_admin?: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
