export interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
}

export interface CreateSavedSearchPayload {
  name: string;
  filters?: Record<string, unknown>;
}
