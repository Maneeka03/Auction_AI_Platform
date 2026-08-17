import { apiClient } from "@/lib/api/client";
import type { AuctionComment } from "@/types/comment";

export function listComments(
  accessToken: string,
  auctionId: string,
  limit = 50,
): Promise<AuctionComment[]> {
  return apiClient.get<AuctionComment[]>(
    `/api/v1/auctions/${auctionId}/comments?limit=${limit}`,
    { accessToken },
  );
}

export function postComment(
  accessToken: string,
  auctionId: string,
  body: string,
): Promise<AuctionComment> {
  return apiClient.post<AuctionComment>(
    `/api/v1/auctions/${auctionId}/comments`,
    { body },
    { accessToken },
  );
}
