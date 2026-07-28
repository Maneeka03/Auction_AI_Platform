"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/session-context";
import { useTenant } from "@/lib/tenant/tenant-context";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const { slug } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace(slug ? `/${slug}/login` : "/login");
      return;
    }
    // Buyer/seller with no tenant assigned → send to discovery to pick a platform
    const isBuyerOrSeller = session.roles.some((r) => r === "buyer" || r === "seller");
    if (isBuyerOrSeller && !session.tenant_id && !slug) {
      router.replace("/");
    }
  }, [isLoading, session, slug, router]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
