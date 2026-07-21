import { apiClient } from "@/lib/api/client";
import type { Bid, Participant, PlaceBidRequest } from "@/types/bid";

export function placeBid(accessToken: string, auctionId: string, payload: PlaceBidRequest): Promise<Bid> {
  return apiClient.post<Bid>(`/api/v1/auctions/${auctionId}/bids`, payload, { accessToken });
}

export function listBids(accessToken: string, auctionId: string): Promise<Bid[]> {
  return apiClient.get<Bid[]>(`/api/v1/auctions/${auctionId}/bids`, { accessToken });
}

// Admin/Supervisor only — 403 for anyone else.
export function listParticipants(accessToken: string, auctionId: string): Promise<Participant[]> {
  return apiClient.get<Participant[]>(`/api/v1/auctions/${auctionId}/participants`, { accessToken });
}