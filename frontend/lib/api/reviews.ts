import { apiClient } from "./client";
import type { CreateReviewPayload, Review } from "@/types/review";

export function createReview(token: string, payload: CreateReviewPayload): Promise<Review> {
  return apiClient.post("/api/v1/reviews", payload, { accessToken: token });
}

export function getSellerReviews(token: string, sellerId: string): Promise<Review[]> {
  return apiClient.get(`/api/v1/reviews/seller/${sellerId}`, { accessToken: token });
}

export function getPropertyReviews(token: string, propertyId: string): Promise<Review[]> {
  return apiClient.get(`/api/v1/reviews/property/${propertyId}`, { accessToken: token });
}
