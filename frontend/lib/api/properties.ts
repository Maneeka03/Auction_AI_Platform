import { apiClient } from "@/lib/api/client";
import type {
  CreatePropertyRequest,
  ListPropertiesParams,
  Property,
  PropertyPage,
  UpdatePropertyRequest,
} from "@/types/property";

const BASE = "/api/v1/properties";

export function listProperties(accessToken: string, params: ListPropertiesParams = {}): Promise<PropertyPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.status) query.set("status", params.status);

  const queryString = query.toString();
  return apiClient.get<PropertyPage>(`${BASE}${queryString ? `?${queryString}` : ""}`, { accessToken });
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