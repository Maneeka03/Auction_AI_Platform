import { apiClient } from "@/lib/api/client";
import type {
  Campaign,
  CampaignPage,
  CampaignStatus,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from "@/types/campaign";

const BASE = "/api/v1/campaigns";

export function listCampaigns(
  accessToken: string,
  params: { page?: number; size?: number; status?: CampaignStatus },
): Promise<CampaignPage> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("size", String(params.size ?? 25));
  if (params.status) query.set("status", params.status);
  return apiClient.get<CampaignPage>(`${BASE}?${query}`, { accessToken });
}

export function getCampaign(accessToken: string, campaignId: string): Promise<Campaign> {
  return apiClient.get<Campaign>(`${BASE}/${campaignId}`, { accessToken });
}

export function createCampaign(accessToken: string, payload: CreateCampaignRequest): Promise<Campaign> {
  return apiClient.post<Campaign>(BASE, payload, { accessToken });
}

export function updateCampaign(
  accessToken: string,
  campaignId: string,
  payload: UpdateCampaignRequest,
): Promise<Campaign> {
  return apiClient.patch<Campaign>(`${BASE}/${campaignId}`, payload, { accessToken });
}

export function sendCampaign(accessToken: string, campaignId: string): Promise<Campaign> {
  return apiClient.post<Campaign>(`${BASE}/${campaignId}/send`, undefined, { accessToken });
}

export function deleteCampaign(accessToken: string, campaignId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${campaignId}`, { accessToken });
}
