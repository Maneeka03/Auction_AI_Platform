import { apiClient } from "@/lib/api/client";
import type { CategoryTree } from "@/types/category";

export interface TenantDiscoverOut {
  id: string;
  slug: string;
  platform_name: string;
  logo_url: string | null;
  primary_color: string;
  categories: CategoryTree[];
}

export function discoverTenants(): Promise<TenantDiscoverOut[]> {
  return apiClient.get<TenantDiscoverOut[]>("/api/v1/discover");
}
