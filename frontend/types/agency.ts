import type { UserStatus } from "@/types/auth";

export interface SuperAdmin {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  country: string | null;
  slug: string | null;
  last_login_at: string | null;
  created_at: string;
}

export interface PaginatedSuperAdmins {
  items: SuperAdmin[];
  total: number;
  page: number;
  size: number;
}

export interface CreateSuperAdminPayload {
  email: string;
  full_name: string;
  country?: string;
  password?: string;
}

export interface UpdateSuperAdminPayload {
  full_name?: string;
  status?: "active" | "suspended";
}

export interface SidebarItem {
  id: string;
  key: string;
  label: string;
  default_order: number;
}

export interface SidebarEntry {
  item_id: string;
  key: string;
  label: string;
  visible: boolean;
  position: number;
}

export interface SaveSidebarPayload {
  items: { item_id: string; visible: boolean }[];
}

export interface UserBranding {
  platform_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

export interface UpdateUserBrandingPayload {
  platform_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
}
