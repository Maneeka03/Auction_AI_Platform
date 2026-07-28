import { apiClient } from "@/lib/api/client";
import type { BrandingSettings, UpdateBrandingPayload } from "@/types/settings";

const BASE = "/api/v1/admin/settings";

export function getBrandingPublic(): Promise<BrandingSettings> {
  return apiClient.get<BrandingSettings>("/api/v1/branding");
}

/** Branding for the current logged-in user — respects tenant isolation. */
export function getMyBranding(accessToken: string): Promise<BrandingSettings> {
  return apiClient.get<BrandingSettings>("/api/v1/users/me/branding", { accessToken });
}

export function getBranding(accessToken: string): Promise<BrandingSettings> {
  return apiClient.get<BrandingSettings>(`${BASE}/branding`, { accessToken });
}

export function updateBranding(
  accessToken: string,
  payload: UpdateBrandingPayload,
): Promise<BrandingSettings> {
  return apiClient.patch<BrandingSettings>(`${BASE}/branding`, payload, { accessToken });
}
