"use client";

import { HelpCircle, LifeBuoy, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationPromptBanner } from "@/components/notifications/NotificationPromptBanner";
// PushEnableButton removed from navbar — now in /settings page
// import { PushEnableButton } from "@/components/notifications/PushEnableButton";
import { useAuth } from "@/lib/auth/session-context";
import { BuyerSidebar } from "@/components/layout/BuyerSidebar";

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function BuyerShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  useEffect(() => {
    if (!profileOpen && !helpOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen, helpOpen]);

  const userInitials = session ? initialsFromName(session.full_name) : "?";

  return (
    <div className="buyer-shell flex min-h-screen bg-neutral-50">
      <BuyerSidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
          <NotificationPromptBanner />
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <Menu size={19} />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:flex"
          >
            {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>

          <div className="flex items-center gap-2">
            {/* Help */}
            <div ref={helpRef} className="relative">
              <button
                type="button"
                onClick={() => setHelpOpen((prev) => !prev)}
                aria-label="Help and support"
                aria-expanded={helpOpen}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                <HelpCircle size={17} />
              </button>
              {helpOpen ? (
                <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                  <Link
                    href="/support/faq"
                    onClick={() => setHelpOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <HelpCircle size={15} className="text-brand-500" /> FAQ
                  </Link>
                  <Link
                    href="/support"
                    onClick={() => setHelpOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <LifeBuoy size={15} className="text-brand-500" /> Contact Support
                  </Link>
                </div>
              ) : null}
            </div>

            {/* PushEnableButton moved to /settings page */}
            <ThemeToggle />
            <NotificationBell />

            {/* Account menu */}
            <div ref={profileRef} className="relative ml-1">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-600 dark:text-white"
              >
                {session?.avatar_url ? <img src={session.avatar_url} alt="" className="h-full w-full object-cover rounded-full" /> : userInitials}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-500" />
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-neutral-900">{session?.full_name}</p>
                    <p className="text-xs text-neutral-500">{session?.email}</p>
                  </div>
                  <div className="my-1 border-t border-neutral-100" />
                  <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    <User size={16} /> Profile
                  </Link>
                  <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    <Settings size={16} /> Settings
                  </Link>
                  <div className="my-1 border-t border-neutral-100" />
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); void handleSignOut(); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-500/5"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
