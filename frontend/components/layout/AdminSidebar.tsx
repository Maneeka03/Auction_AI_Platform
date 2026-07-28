"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandingLogo } from "@/components/branding/BrandingLogo";
import { superAdminNav } from "@/lib/navigation/superAdminNav";
import { useAuth } from "@/lib/auth/session-context";
import { apiClient } from "@/lib/api/client";
import type { NavSection } from "@/types/navigation";

interface AdminSidebarProps {
  isOpen: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const STAFF_ROLES = new Set([
  "super_admin",
  "auction_manager",
  "marketing",
  "legal",
  "finance",
  "gemologist",
  "executive",
]);

// Maps sidebar item keys (stored in DB) to the href values used in superAdminNav
const KEY_TO_HREF: Record<string, string> = {
  dashboard: "/dashboard",
  approvals: "/approvals",
  listings: "/listings",
  categories: "/admin/categories",
  properties: "/properties",
  escrow: "/admin/escrow",
  wallet: "/wallet",
  auctions: "/auctions",
  "crm-buyers": "/crm/buyers",
  "crm-sellers": "/crm/sellers",
  leads: "/crm/leads",
  campaigns: "/marketing",
  revenue: "/reports/revenue",
  "auction-activity": "/reports/auction-activity",
  users: "/admin/users",
  kyc: "/admin/kyc",
  settings: "/settings",
};

interface SidebarPref {
  key: string;
  visible: boolean;
  position: number;
}

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const { session, accessToken, isLoading } = useAuth();
  // null = not yet loaded (show all while loading), Set = loaded
  const [hiddenHrefs, setHiddenHrefs] = useState<Set<string> | null>(null);

  const isStaff =
    !isLoading && session
      ? session.roles.some((role) => STAFF_ROLES.has(role))
      : false;

  useEffect(() => {
    if (!accessToken) return;

    apiClient
      .get<SidebarPref[]>("/api/v1/admin/settings/sidebar", {
        accessToken,
      })
      .then((prefs) => {
        const hidden = new Set<string>();
        for (const pref of prefs) {
          if (!pref.visible) {
            const href = KEY_TO_HREF[pref.key];
            if (href) hidden.add(href);
          }
        }
        setHiddenHrefs(hidden);
      })
      .catch(() => {
        // On error, fall back to showing all items
        setHiddenHrefs(new Set());
      });
  }, [accessToken]);

  if (!isStaff) {
    return null;
  }

  const effectiveNav: NavSection[] = superAdminNav
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => hiddenHrefs === null || !hiddenHrefs.has(item.href),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-neutral-200 bg-white transition-all duration-200 ${
        isOpen ? "w-64" : "w-[72px]"
      }`}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-neutral-200 px-4">
        <BrandingLogo showName={isOpen} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {effectiveNav.map((section) => (
          <div key={section.title} className="mb-5">
            {isOpen ? (
              <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={isOpen ? undefined : item.label}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      } ${isOpen ? "" : "justify-center"}`}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {isOpen ? <span>{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
