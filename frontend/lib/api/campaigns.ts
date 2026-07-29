import { apiClient } from "@/lib/api/client";
import type {
  Campaign,
  CampaignPage,
  CreateCampaignRequest,
  ListCampaignsParams,
  UpdateCampaignRequest,
} from "@/types/campaign";

const BASE = "/api/v1/campaigns";

export function listCampaigns(accessToken: string, params: ListCampaignsParams = {}): Promise<CampaignPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  return apiClient.get<CampaignPage>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
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