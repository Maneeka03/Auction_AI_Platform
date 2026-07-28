"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/session-context";
import { useTenant } from "@/lib/tenant/tenant-context";
import type { UserRole } from "@/types/auth";

const STAFF_ROLES = new Set<UserRole>([
  "super_admin", "auction_manager", "marketing", "legal", "finance", "gemologist", "executive",
]);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();
  const { slug } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace(slug ? `/${slug}/login` : "/login");
      return;
    }
    if (!session.roles.some((r) => STAFF_ROLES.has(r))) {
      router.replace(slug ? `/${slug}/properties` : "/properties");
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
