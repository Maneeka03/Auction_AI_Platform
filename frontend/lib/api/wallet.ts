import { apiClient } from "@/lib/api/client";
import type { BuyerWalletPage, TopUpRequest, WalletEntry, WalletSummary, WithdrawRequest } from "@/types/wallet";

const BASE = "/api/v1/wallet";

export function getWallet(accessToken: string): Promise<WalletSummary> {
  return apiClient.get<WalletSummary>(BASE, { accessToken });
}

export function topUpWallet(accessToken: string, payload: TopUpRequest): Promise<WalletSummary> {
  return apiClient.post<WalletSummary>(`${BASE}/top-up`, payload, { accessToken });
}

export function withdrawFromWallet(accessToken: string, payload: WithdrawRequest): Promise<WalletSummary> {
  return apiClient.post<WalletSummary>(`${BASE}/withdraw`, payload, { accessToken });
}

export function listWalletTransactions(accessToken: string, limit = 50): Promise<WalletEntry[]> {
  return apiClient.get<WalletEntry[]>(`${BASE}/transactions?limit=${limit}`, { accessToken });
}

export function listBuyerWallets(
  accessToken: string,
  params: { page?: number; size?: number; search?: string } = {},
): Promise<BuyerWalletPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);

  const queryString = query.toString();
  return apiClient.get<BuyerWalletPage>(`${BASE}/buyers${queryString ? `?${queryString}` : ""}`, { accessToken });
}