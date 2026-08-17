import { apiClient } from "@/lib/api/client";
import type { UserStatus } from "@/types/auth";

export interface SuperAdmin {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  status: UserStatus;
  country: string | null;
  last_login_at: string | null;
  roles: string[];
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
}

export interface UpdateSuperAdminPayload {
  full_name?: string;
  status?: "active" | "suspended";
}

const BASE = "/api/v1/agency/super-admins";

export function listSuperAdmins(
  accessToken: string,
  params: { page?: number; size?: number; search?: string; status?: UserStatus } = {},
): Promise<PaginatedSuperAdmins> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return apiClient.get<PaginatedSuperAdmins>(`${BASE}${qs ? `?${qs}` : ""}`, { accessToken });
}

export function createSuperAdmin(
  accessToken: string,
  payload: CreateSuperAdminPayload,
): Promise<SuperAdmin> {
  return apiClient.post<SuperAdmin>(BASE, payload, { accessToken });
}

export function updateSuperAdmin(
  accessToken: string,
  userId: string,
  payload: UpdateSuperAdminPayload,
): Promise<SuperAdmin> {
  return apiClient.patch<SuperAdmin>(`${BASE}/${userId}`, payload, { accessToken });
}

export function deleteSuperAdmin(accessToken: string, userId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${userId}`, { accessToken });
}
