import { apiClient } from "./client";
import type { BuyerDashboard, Purchase } from "@/types/portal";
import type { Property } from "@/types/property";

export function getBuyerDashboard(token: string): Promise<BuyerDashboard> {
  return apiClient.get("/api/v1/me/dashboard", { accessToken: token });
}

export function getRecommendations(token: string, limit = 12): Promise<Property[]> {
  return apiClient.get(`/api/v1/me/recommendations?limit=${limit}`, { accessToken: token });
}

export function getPurchases(token: string): Promise<Purchase[]> {
  return apiClient.get("/api/v1/me/purchases", { accessToken: token });
}

export function confirmDelivery(token: string, escrowId: string): Promise<Purchase> {
  return apiClient.patch(`/api/v1/me/purchases/${escrowId}/delivery`, {}, { accessToken: token });
}
