export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "accountant" | "seller" | "buyer" | "pending";
  is_verified: boolean;
  department?: string;
  title?: string;
  phone_office?: string;
  phone_mobile?: string;
  last_login_ip?: string;
  created_at: string;
}

export interface RegisterRequest {
  member_type: "seller" | "buyer" | "accountant";
  name: string;
  company_name: string;
  department: string;
  title: string;
  phone_office: string;
  phone_mobile: string;
  email: string;
  password: string;
  password_confirm: string;
  interests: string[];
  terms_1: boolean;
  terms_2: boolean;
  terms_3: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  role: string;
  is_verified: boolean;
}
