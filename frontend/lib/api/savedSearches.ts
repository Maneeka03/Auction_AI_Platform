import { apiClient } from "./client";
import type { CreateSavedSearchPayload, SavedSearch } from "@/types/savedSearch";

export function createSavedSearch(token: string, payload: CreateSavedSearchPayload): Promise<SavedSearch> {
  return apiClient.post("/api/v1/saved-searches", payload, { accessToken: token });
}

export function listSavedSearches(token: string): Promise<SavedSearch[]> {
  return apiClient.get("/api/v1/saved-searches", { accessToken: token });
}

export function deleteSavedSearch(token: string, searchId: string): Promise<void> {
  return apiClient.delete(`/api/v1/saved-searches/${searchId}`, { accessToken: token });
}
