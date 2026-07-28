import { apiClient } from "@/lib/api/client";

export interface TenantPublicOut {
  id: string;
  slug: string;
  platform_name: string;
  logo_url: string | null;
  primary_color: string;
}

export function getTenantBySlug(slug: string): Promise<TenantPublicOut> {
  return apiClient.get<TenantPublicOut>(`/api/v1/t/${slug}`);
}
