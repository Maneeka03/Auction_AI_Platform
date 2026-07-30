"use client";

import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/auth/session-context";
import { SellerSidebar } from "@/components/layout/SellerSidebar";

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function SellerShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <SellerSidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <Menu size={19} />
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:flex"
          >
            {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>

          <div className="flex items-center gap-2">
            <NotificationBell />
            {session ? (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
                title={session.full_name}
              >
                {initialsFromName(session.full_name)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
