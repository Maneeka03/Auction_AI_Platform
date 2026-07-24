import { apiClient } from "@/lib/api/client";
import type {
  CreatePropertyRequest,
  ListPropertiesParams,
  Property,
  PropertyPage,
  PurchaseRequest,
  UpdatePropertyRequest,
  VoteRequest,
} from "@/types/property";

const BASE = "/api/v1/properties";

export function listProperties(accessToken: string, params: ListPropertiesParams = {}): Promise<PropertyPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.category_id) query.set("category_id", params.category_id);
  if (params.status) query.set("status", params.status);
  if (params.min_price) query.set("min_price", String(params.min_price));
  if (params.max_price) query.set("max_price", String(params.max_price));

  const queryString = query.toString();
  return apiClient.get<PropertyPage>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function listPublicProperties(
  params: {
    page?: number;
    size?: number;
    search?: string;
    category_id?: string;
  } = {},
): Promise<PropertyPage> {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.category_id) query.set("category_id", params.category_id);

  const queryString = query.toString();

  return apiClient.get<PropertyPage>(
    `${BASE}/public${queryString ? `?${queryString}` : ""}`,
  );
}

export function getProperty(accessToken: string, propertyId: string): Promise<Property> {
  return apiClient.get<Property>(`${BASE}/${propertyId}`, { accessToken });
}

export function createProperty(accessToken: string, payload: CreatePropertyRequest): Promise<Property> {
  return apiClient.post<Property>(BASE, payload, { accessToken });
}

export function updateProperty(
  accessToken: string,
  propertyId: string,
  payload: UpdatePropertyRequest,
): Promise<Property> {
  return apiClient.patch<Property>(`${BASE}/${propertyId}`, payload, { accessToken });
}

export function purchaseProperty(
  accessToken: string,
  propertyId: string,
  payload: PurchaseRequest,
): Promise<Property> {
  return apiClient.post<Property>(`${BASE}/${propertyId}/purchase`, payload, { accessToken });
}


export function voteOnProperty(
  accessToken: string,
  propertyId: string,
  payload: VoteRequest,
): Promise<Property> {
  return apiClient.post<Property>(`${BASE}/${propertyId}/votes`, payload, { accessToken });
}


export function deleteProperty(accessToken: string, propertyId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${propertyId}`, { accessToken });
}