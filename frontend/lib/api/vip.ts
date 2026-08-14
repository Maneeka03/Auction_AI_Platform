import { apiClient } from "./client";
import type {
  VipProfile,
  VipTierInfo,
  VipTokenTransactionPage,
  VipTier,
} from "@/types/vip";

export const vipApi = {
  getTiers: () =>
    apiClient.get<VipTierInfo[]>("/api/v1/vip/tiers"),

  getProfile: (accessToken: string) =>
    apiClient.get<VipProfile>("/api/v1/vip/me", {
      accessToken,
    }),

  purchaseTokens: (accessToken: string, quantity: number) =>
    apiClient.post<VipProfile>(
      "/api/v1/vip/tokens/purchase",
      { quantity },
      { accessToken },
    ),

  getTransactions: (accessToken: string, page = 1, size = 25) =>
    apiClient.get<VipTokenTransactionPage>(
      `/api/v1/vip/tokens/transactions?page=${page}&size=${size}`,
      { accessToken },
    ),

  payMembership: (accessToken: string, tier: VipTier) =>
    apiClient.post<VipProfile>(
      "/api/v1/vip/membership",
      { tier },
      { accessToken },
    ),

  spendTokenToView: (accessToken: string, propertyId: string) =>
    apiClient.post<VipProfile>(
      `/api/v1/vip/items/${propertyId}/view`,
      undefined,
      { accessToken },
    ),
};