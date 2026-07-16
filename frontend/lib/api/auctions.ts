import { apiClient } from "@/lib/api/client";
import type {
  Auction,
  AuctionPage,
  CreateAuctionRequest,
  ListAuctionsParams,
  UpdateAuctionRequest,
} from "@/types/auction";

const BASE = "/api/v1/auctions";

export function listAuctions(accessToken: string, params: ListAuctionsParams = {}): Promise<AuctionPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  return apiClient.get<AuctionPage>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function getAuction(accessToken: string, auctionId: string): Promise<Auction> {
  return apiClient.get<Auction>(`${BASE}/${auctionId}`, { accessToken });
}

export function createAuction(accessToken: string, payload: CreateAuctionRequest): Promise<Auction> {
  return apiClient.post<Auction>(BASE, payload, { accessToken });
}

export function updateAuction(
  accessToken: string,
  auctionId: string,
  payload: UpdateAuctionRequest,
): Promise<Auction> {
  return apiClient.patch<Auction>(`${BASE}/${auctionId}`, payload, { accessToken });
}

export function endAuction(accessToken: string, auctionId: string): Promise<Auction> {
  return apiClient.post<Auction>(`${BASE}/${auctionId}/end`, undefined, { accessToken });
}

export function awardAuction(accessToken: string, auctionId: string, bidderId: string): Promise<Auction> {
  return apiClient.post<Auction>(`${BASE}/${auctionId}/award`, { bidder_id: bidderId }, { accessToken });
}