import { apiClient } from "@/lib/api/client";
import type { MarkReadRequest, NotificationPage } from "@/types/notification";

const BASE = "/api/v1/notifications";

export function listNotifications(
  accessToken: string,
  params: { limit?: number; unreadOnly?: boolean } = {},
): Promise<NotificationPage> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.unreadOnly) query.set("unread_only", "true");
  const queryString = query.toString();
  return apiClient.get<NotificationPage>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function markNotificationsRead(accessToken: string, payload: MarkReadRequest = {}): Promise<void> {
  return apiClient.post<void>(`${BASE}/read`, payload, { accessToken });
}