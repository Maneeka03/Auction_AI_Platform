export type UserRole =
  | "super_admin"
  | "auction_manager"
  | "marketing"
  | "legal"
  | "finance"
  | "gemologist"
  | "buyer"
  | "seller"
  | "executive";

export type UserStatus = "pending_verification" | "active" | "suspended" | "deleted";

export type PermissionLevel = "none" | "view" | "full";

export type PermissionModule =
  | "buyer_crm"
  | "seller_crm"
  | "lead_management"
  | "asset_management"
  | "auction_management"
  | "bid_management"
  | "marketing_campaigns"
  | "ai_configuration"
  | "payment_escrow"
  | "reports"
  | "system_settings"
  | "user_management"
  | "notifications";

export interface Session {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  country: string | null;
  business_type: string | null;
  email_verified_at: string | null;
  last_login_at: string | null;
  roles: UserRole[];
  permissions: Record<PermissionModule, PermissionLevel>;
}

export interface AccessToken {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: "buyer" | "seller";
  country?: string | null;
  business_type?: string | null;
}

export interface ApiErrorField {
  field: string;
  reason: string;
}