import { apiClient } from "./client";
import type { WatchlistItem } from "@/types/watchlist";

export function addToWatchlist(token: string, propertyId: string): Promise<void> {
  return apiClient.post("/api/v1/watchlist", { property_id: propertyId }, { accessToken: token });
}

export function listWatchlist(token: string): Promise<WatchlistItem[]> {
  return apiClient.get("/api/v1/watchlist", { accessToken: token });
}

export function updateWatchlistStatus(token: string, propertyId: string, status: string): Promise<WatchlistItem> {
  return apiClient.patch(`/api/v1/watchlist/${propertyId}`, { status }, { accessToken: token });
}

export function removeFromWatchlist(token: string, propertyId: string): Promise<void> {
  return apiClient.delete(`/api/v1/watchlist/${propertyId}`, { accessToken: token });
}
