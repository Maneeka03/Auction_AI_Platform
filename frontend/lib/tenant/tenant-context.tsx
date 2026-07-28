"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getTenantBySlug, type TenantPublicOut } from "@/lib/api/tenant";

function getSlugFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)tenant-slug=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface TenantContextValue {
  slug: string | null;
  tenantId: string | null;
  tenant: TenantPublicOut | null;
}

const TenantContext = createContext<TenantContextValue>({
  slug: null,
  tenantId: null,
  tenant: null,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [slug, setSlug] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantPublicOut | null>(null);

  useEffect(() => {
    const s = getSlugFromCookie();
    if (!s) return;
    setSlug(s);
    getTenantBySlug(s)
      .then(setTenant)
      .catch(() => {});
  }, [pathname]);

  return (
    <TenantContext.Provider value={{ slug, tenantId: tenant?.id ?? null, tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  return useContext(TenantContext);
}
