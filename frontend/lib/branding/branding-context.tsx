"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getTenantBySlug } from "@/lib/api/tenant";
import { getBrandingPublic, getMyBranding } from "@/lib/api/settings";
import { useAuth } from "@/lib/auth/session-context";
import { useTenant } from "@/lib/tenant/tenant-context";
import type { BrandingSettings } from "@/types/settings";

// ─── Color scale derivation ──────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [h * 360, s * 100, l * 100];
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function applyColorScale(hex600: string): void {
  if (typeof document === "undefined") return;
  const [r, g, b] = hexToRgb(hex600);
  const [h, s] = rgbToHsl(r, g, b);
  const root = document.documentElement;
  const shades: [string, number][] = [
    ["--color-brand-50",  97],
    ["--color-brand-100", 93],
    ["--color-brand-200", 85],
    ["--color-brand-300", 73],
    ["--color-brand-500", 62],
    ["--color-brand-700", 43],
    ["--color-brand-900", 25],
  ];
  for (const [variable, lightness] of shades) {
    root.style.setProperty(variable, hslToHex(h, s, lightness));
  }
  root.style.setProperty("--color-brand-600", hex600);
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface BrandingContextValue {
  platformName: string;
  logoUrl: string | null;
  primaryColor: string;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue>({
  platformName: "Auction Platform",
  logoUrl: null,
  primaryColor: "#5b45d6",
  refreshBranding: async () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [platformName, setPlatformName] = useState("Auction Platform");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#5b45d6");
  const { accessToken } = useAuth();
  const { slug } = useTenant();

  const apply = useCallback((data: BrandingSettings) => {
    setPlatformName(data.platform_name);
    setLogoUrl(data.logo_url);
    setPrimaryColor(data.primary_color);
    applyColorScale(data.primary_color);
  }, []);

  const refreshBranding = useCallback(async () => {
    if (accessToken) {
      try {
        apply(await getMyBranding(accessToken));
        return;
      } catch {
        // fall through
      }
    }
    // Not logged in — use tenant public branding when on a tenant URL
    if (slug) {
      try {
        const t = await getTenantBySlug(slug);
        apply({ platform_name: t.platform_name, logo_url: t.logo_url, primary_color: t.primary_color });
        return;
      } catch {
        // fall through
      }
    }
    try {
      apply(await getBrandingPublic());
    } catch {
      // Keep defaults — backend unreachable
    }
  }, [apply, accessToken, slug]);

  useEffect(() => {
    void refreshBranding();
  }, [refreshBranding]);

  return (
    <BrandingContext.Provider value={{ platformName, logoUrl, primaryColor, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  return useContext(BrandingContext);
}
