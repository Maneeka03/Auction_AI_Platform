export interface BrandingSettings {
  platform_name: string;
  logo_url: string | null;
  primary_color: string;
}

export interface UpdateBrandingPayload {
  platform_name?: string;
  logo_url?: string | null;
  primary_color?: string;
}
