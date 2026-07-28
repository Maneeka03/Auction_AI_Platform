"use client";

import { LayoutGrid, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BrandingLogo } from "@/components/branding/BrandingLogo";
import { useAuth } from "@/lib/auth/session-context";

const navItems = [
  { label: "Super Admins", href: "/agency/super-admins", icon: Users },
  { label: "Sidebar Config", href: "/agency/sidebar", icon: LayoutGrid },
  // Platform-wide branding (logo, color, name) — reflects on all login pages
  { label: "Settings", href: "/agency/settings", icon: Settings },
];

export function AgencyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="flex h-16 items-center border-b border-neutral-200 px-4">
          <BrandingLogo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Agency
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <div className="mb-1 rounded-lg px-2.5 py-2">
            <p className="truncate text-sm font-medium text-neutral-900">{session?.full_name}</p>
            <p className="truncate text-xs text-neutral-500">{session?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-danger-600 hover:bg-danger-500/5"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — scrolls independently */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
        {children}
      </div>
    </div>
  );
}
