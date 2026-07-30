import { apiClient } from "./client";
import type {
  AuctionRequest,
  AuctionRequestStatus,
  CreateAuctionRequestPayload,
  ReviewAuctionRequestPayload,
} from "@/types/auctionRequest";

export function submitAuctionRequest(
  token: string,
  payload: CreateAuctionRequestPayload,
): Promise<AuctionRequest> {
  return apiClient.post("/api/v1/seller/auction-requests", payload, { accessToken: token });
}

export function listMyAuctionRequests(token: string): Promise<AuctionRequest[]> {
  return apiClient.get("/api/v1/seller/auction-requests", { accessToken: token });
}

export function listAllAuctionRequests(
  token: string,
  filterStatus?: AuctionRequestStatus,
): Promise<AuctionRequest[]> {
  const params = filterStatus ? `?filter_status=${filterStatus}` : "";
  return apiClient.get(`/api/v1/admin/auction-requests${params}`, { accessToken: token });
}

export function reviewAuctionRequest(
  token: string,
  requestId: string,
  payload: ReviewAuctionRequestPayload,
): Promise<AuctionRequest> {
  return apiClient.patch(`/api/v1/admin/auction-requests/${requestId}`, payload, {
    accessToken: token,
  });
}
