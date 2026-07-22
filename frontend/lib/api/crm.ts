import { apiClient } from "@/lib/api/client";
import type {
  BuyerCrmPage,
  CreateLeadRequest,
  Lead,
  LeadPage,
  ListCrmParams,
  ListLeadsParams,
  SellerCrmPage,
  UpdateLeadRequest,
} from "@/types/crm";

const BASE = "/api/v1/crm";

export function listBuyers(accessToken: string, params: ListCrmParams = {}): Promise<BuyerCrmPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);

  const queryString = query.toString();
  return apiClient.get<BuyerCrmPage>(`${BASE}/buyers${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function listSellers(accessToken: string, params: ListCrmParams = {}): Promise<SellerCrmPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);

  const queryString = query.toString();
  return apiClient.get<SellerCrmPage>(`${BASE}/sellers${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function listLeads(accessToken: string, params: ListLeadsParams = {}): Promise<LeadPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  return apiClient.get<LeadPage>(`${BASE}/leads${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function getLead(accessToken: string, leadId: string): Promise<Lead> {
  return apiClient.get<Lead>(`${BASE}/leads/${leadId}`, { accessToken });
}

export function createLead(accessToken: string, payload: CreateLeadRequest): Promise<Lead> {
  return apiClient.post<Lead>(`${BASE}/leads`, payload, { accessToken });
}

export function updateLead(accessToken: string, leadId: string, payload: UpdateLeadRequest): Promise<Lead> {
  return apiClient.patch<Lead>(`${BASE}/leads/${leadId}`, payload, { accessToken });
}

export function deleteLead(accessToken: string, leadId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/leads/${leadId}`, { accessToken });
}