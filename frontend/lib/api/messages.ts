import { apiClient } from "./client";
import type {
  AdminThread,
  ChatUser,
  DmMessage,
  DmThread,
  GroupChat,
  GroupMessage,
} from "@/types/messaging";

// ── DM endpoints ───────────────────────────────────────────────────────────────

export function sendDm(
  token: string,
  recipientId: string,
  body: string,
): Promise<DmMessage> {
  return apiClient.post("/api/v1/messages", { recipient_id: recipientId, body }, { accessToken: token });
}

export function listDmThreads(token: string): Promise<DmThread[]> {
  return apiClient.get("/api/v1/messages", { accessToken: token });
}

export function getDmThread(token: string, otherUserId: string): Promise<DmMessage[]> {
  return apiClient.get(`/api/v1/messages/${otherUserId}`, { accessToken: token });
}

// ── Admin endpoints ────────────────────────────────────────────────────────────

export function adminAllThreads(token: string): Promise<AdminThread[]> {
  return apiClient.get("/api/v1/messages/admin/all", { accessToken: token });
}

export function adminReadThread(
  token: string,
  userAId: string,
  userBId: string,
): Promise<DmMessage[]> {
  return apiClient.get(`/api/v1/messages/admin/${userAId}/${userBId}`, { accessToken: token });
}

// ── Chat search ────────────────────────────────────────────────────────────────

export function chatSearch(token: string, q: string): Promise<ChatUser[]> {
  return apiClient.get(`/api/v1/messages/chat-search?q=${encodeURIComponent(q)}`, { accessToken: token });
}

// ── Group endpoints ────────────────────────────────────────────────────────────

export function createGroup(
  token: string,
  name: string,
  memberIds: string[],
): Promise<GroupChat> {
  return apiClient.post("/api/v1/groups", { name, member_ids: memberIds }, { accessToken: token });
}

export function listGroups(token: string): Promise<GroupChat[]> {
  return apiClient.get("/api/v1/groups", { accessToken: token });
}

export function getGroupMessages(token: string, groupId: string): Promise<GroupMessage[]> {
  return apiClient.get(`/api/v1/groups/${groupId}/messages`, { accessToken: token });
}

export function sendGroupMessage(
  token: string,
  groupId: string,
  body: string,
): Promise<GroupMessage> {
  return apiClient.post(`/api/v1/groups/${groupId}/messages`, { body }, { accessToken: token });
}
