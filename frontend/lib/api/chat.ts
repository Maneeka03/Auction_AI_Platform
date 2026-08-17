import { apiClient } from "@/lib/api/client";
import type { ChatMessage } from "@/types/chat";

const BASE = "/api/v1/auctions";

export function listChat(accessToken: string, auctionId: string, limit = 100): Promise<ChatMessage[]> {
  return apiClient.get<ChatMessage[]>(`${BASE}/${auctionId}/chat?limit=${limit}`, { accessToken });
}

export function postChat(accessToken: string, auctionId: string, body: string): Promise<ChatMessage> {
  return apiClient.post<ChatMessage>(`${BASE}/${auctionId}/chat`, { body }, { accessToken });
}
