"use client";

import {
  FileBarChart,
  Gavel,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  MessageSquare,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/auth/session-context";
import { useUnreadMessageCount } from "@/lib/hooks/useUnreadMessageCount";

type MenuKey = "apps" | "help" | "reports" | "messages" | "notifications" | "profile";

const appLinks = [
  { label: "Auctions", description: "Browse live and upcoming", href: "/auctions", icon: Gavel },
  { label: "Listings", description: "Review submitted items", href: "/listings", icon: PackageSearch },
  { label: "Buyers", description: "Buyer directory", href: "/crm/buyers", icon: Users },
  { label: "Sellers", description: "Seller directory", href: "/crm/sellers", icon: UserCircle },
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface AdminTopbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

export function AdminTopbar({ isSidebarOpen, onToggleSidebar, onOpenMobileNav }: AdminTopbarProps) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const unreadMsgCount = useUnreadMessageCount();
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((prev) => (prev === key ? null : key));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  function toggleDarkMode() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  const userName = session?.full_name ?? "Guest";
  const userInitials = session ? initialsFromName(session.full_name) : "?";

  return (
    <header
      ref={containerRef}
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6"
    >
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
      >
        <Menu size={19} />
      </button>

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="hidden h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:flex"
      >
        {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
      </button>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 md:flex"
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>

        {/* Apps quick-nav */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => toggleMenu("apps")}
            aria-label="Quick navigation"
            aria-expanded={openMenu === "apps"}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-500/10 text-success-500 hover:bg-success-500/15"
          >
            <LayoutGrid size={17} />
          </button>
          {openMenu === "apps" ? (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-2 gap-1">
                {appLinks.map((app) => (
                  <Link
                    key={app.label}
                    href={app.href}
                    onClick={() => setOpenMenu(null)}
                    className="flex flex-col items-start gap-1 rounded-lg p-3 hover:bg-neutral-50"
                  >
                    <app.icon size={18} className="text-brand-600" />
                    <span className="text-sm font-medium text-neutral-900">{app.label}</span>
                    <span className="text-xs text-neutral-500">{app.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Help */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => toggleMenu("help")}
            aria-label="Help and support"
            aria-expanded={openMenu === "help"}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100"
          >
            <HelpCircle size={17} />
          </button>
          {openMenu === "help" ? (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
              <Link href="/admin/faqs" onClick={() => setOpenMenu(null)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                FAQ
              </Link>
              <Link href="/help/contact" onClick={() => setOpenMenu(null)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Contact Support
              </Link>
            </div>
          ) : null}
        </div>

        {/* Reports */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => toggleMenu("reports")}
            aria-label="Reports"
            aria-expanded={openMenu === "reports"}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/10 text-amber-600 hover:bg-blue-100/15"
          >
            <FileBarChart size={17} />
          </button>
          {openMenu === "reports" ? (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
              <Link href="/reports/leads" onClick={() => setOpenMenu(null)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Lead Reports
              </Link>
              <Link href="/reports/revenue" onClick={() => setOpenMenu(null)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Revenue Reports
              </Link>
            </div>
          ) : null}
        </div>

        {/* Messages */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => toggleMenu("messages")}
            aria-label="Messages"
            aria-expanded={openMenu === "messages"}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            <MessageSquare size={17} />
            {unreadMsgCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
                {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
              </span>
            ) : null}
          </button>
          {openMenu === "messages" ? (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900">
                Messages
              </div>
              <p className="px-4 py-6 text-center text-sm text-neutral-500">No new messages</p>
              <Link
                href="/messages"
                onClick={() => setOpenMenu(null)}
                className="block px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-neutral-50"
              >
                View all messages
              </Link>
            </div>
          ) : null}
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile */}
        <div className="relative ml-1.5">
          <button
            type="button"
            onClick={() => toggleMenu("profile")}
            aria-label="Account menu"
            aria-expanded={openMenu === "profile"}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
          >
            {userInitials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-500" />
          </button>
          {openMenu === "profile" ? (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-neutral-900">{userName}</p>
                <p className="text-xs text-neutral-500">{session?.email}</p>
              </div>
              <div className="my-1 border-t border-neutral-100" />
              <Link href="/admin/profile" onClick={() => setOpenMenu(null)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                <UserCircle size={16} /> Profile Settings
              </Link>
              <Link href="/settings" onClick={() => setOpenMenu(null)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                <Settings size={16} /> Settings
              </Link>
              <div className="my-1 border-t border-neutral-100" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-500/5"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}