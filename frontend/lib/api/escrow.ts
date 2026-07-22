import { apiClient } from "@/lib/api/client";
import type { Escrow, EscrowPage, ListEscrowsParams } from "@/types/escrow";

const BASE = "/api/v1/escrow";

export function listEscrows(accessToken: string, params: ListEscrowsParams = {}): Promise<EscrowPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.state) query.set("state", params.state);

  const queryString = query.toString();
  return apiClient.get<EscrowPage>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function getEscrow(accessToken: string, escrowId: string): Promise<Escrow> {
  return apiClient.get<Escrow>(`${BASE}/${escrowId}`, { accessToken });
}

/** Moves the escrow one step forward. Reaching "released" pays the seller. */
export function advanceEscrow(accessToken: string, escrowId: string): Promise<Escrow> {
  return apiClient.post<Escrow>(`${BASE}/${escrowId}/advance`, undefined, { accessToken });
}