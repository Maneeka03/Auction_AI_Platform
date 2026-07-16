import { apiClient } from "@/lib/api/client";
import type {
  AdminUserListItem,
  CreateUserPayload,
  ListUsersParams,
  PaginatedUsers,
  UpdateUserPayload,
} from "@/types/adminUsers";

const BASE = "/api/v1/admin/users";

export function listUsers(accessToken: string, params: ListUsersParams = {}): Promise<PaginatedUsers> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  return apiClient.get<PaginatedUsers>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function createUser(accessToken: string, payload: CreateUserPayload): Promise<AdminUserListItem> {
  return apiClient.post<AdminUserListItem>(BASE, payload, { accessToken });
}

export function updateUser(
  accessToken: string,
  userId: string,
  payload: UpdateUserPayload,
): Promise<AdminUserListItem> {
  return apiClient.patch<AdminUserListItem>(`${BASE}/${userId}`, payload, { accessToken });
}

export function deleteUser(accessToken: string, userId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${userId}`, { accessToken });
}