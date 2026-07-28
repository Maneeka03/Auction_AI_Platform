import { apiClient } from "@/lib/api/client";
import type {
  CreateSuperAdminPayload,
  PaginatedSuperAdmins,
  SaveSidebarPayload,
  SidebarEntry,
  SidebarItem,
  SuperAdmin,
  UpdateSuperAdminPayload,
  UpdateUserBrandingPayload,
  UserBranding,
} from "@/types/agency";

const BASE = "/api/v1/agency";

export interface ListSuperAdminsParams {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "suspended";
}

export function listSuperAdmins(
  accessToken: string,
  params: ListSuperAdminsParams = {},
): Promise<PaginatedSuperAdmins> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.size) q.set("size", String(params.size));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiClient.get<PaginatedSuperAdmins>(`${BASE}/super-admins${qs ? `?${qs}` : ""}`, { accessToken });
}

export function createSuperAdmin(
  accessToken: string,
  payload: CreateSuperAdminPayload,
): Promise<SuperAdmin> {
  return apiClient.post<SuperAdmin>(`${BASE}/super-admins`, payload, { accessToken });
}

export function updateSuperAdmin(
  accessToken: string,
  userId: string,
  payload: UpdateSuperAdminPayload,
): Promise<SuperAdmin> {
  return apiClient.patch<SuperAdmin>(`${BASE}/super-admins/${userId}`, payload, { accessToken });
}

export function deleteSuperAdmin(
  accessToken: string,
  userId: string,
  hard = false,
): Promise<void> {
  return apiClient.delete<void>(`${BASE}/super-admins/${userId}${hard ? "?hard=true" : ""}`, { accessToken });
}

export function listSidebarItems(accessToken: string): Promise<SidebarItem[]> {
  return apiClient.get<SidebarItem[]>(`${BASE}/sidebar/items`, { accessToken });
}

export function getSidebar(accessToken: string): Promise<SidebarEntry[]> {
  return apiClient.get<SidebarEntry[]>(`${BASE}/sidebar`, { accessToken });
}

export function saveSidebar(
  accessToken: string,
  payload: SaveSidebarPayload,
): Promise<SidebarEntry[]> {
  return apiClient.put<SidebarEntry[]>(`${BASE}/sidebar`, payload, { accessToken });
}

// ── Per-super-admin branding ──────────────────────────────────────────────────

export function getSuperAdminBranding(accessToken: string, userId: string): Promise<UserBranding> {
  return apiClient.get<UserBranding>(`${BASE}/super-admins/${userId}/branding`, { accessToken });
}

export function updateSuperAdminBranding(
  accessToken: string,
  userId: string,
  payload: UpdateUserBrandingPayload,
): Promise<UserBranding> {
  return apiClient.put<UserBranding>(`${BASE}/super-admins/${userId}/branding`, payload, { accessToken });
}

// ── Per-super-admin sidebar ───────────────────────────────────────────────────

export function getSuperAdminSidebar(accessToken: string, userId: string): Promise<SidebarEntry[]> {
  return apiClient.get<SidebarEntry[]>(`${BASE}/super-admins/${userId}/sidebar`, { accessToken });
}

export function saveSuperAdminSidebar(
  accessToken: string,
  userId: string,
  payload: SaveSidebarPayload,
): Promise<SidebarEntry[]> {
  return apiClient.put<SidebarEntry[]>(`${BASE}/super-admins/${userId}/sidebar`, payload, { accessToken });
}
