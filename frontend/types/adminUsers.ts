import type { Session, UserRole, UserStatus } from "@/types/auth";

// Staff-invitable roles only — POST /admin/users rejects buyer/seller with 422.
export type StaffRole = Exclude<UserRole, "buyer" | "seller">;

export const STAFF_ROLES: StaffRole[] = [
  "super_admin",
  "auction_manager",
  "marketing",
  "legal",
  "finance",
  "gemologist",
  "executive",
];

export interface AdminUserListItem
  extends Pick<Session, "id" | "email" | "full_name" | "status" | "roles" | "country" | "last_login_at"> {}

export interface PaginatedUsers {
  items: AdminUserListItem[];
  total: number;
  page: number;
  size: number;
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  roles: StaffRole[];
  country?: string;
}

export interface UpdateUserPayload {
  status?: UserStatus;
  roles?: StaffRole[];
  full_name?: string;
}

export interface ListUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: StaffRole;
  status?: UserStatus;
}