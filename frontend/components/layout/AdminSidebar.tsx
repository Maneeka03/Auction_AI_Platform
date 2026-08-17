"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auctionManagerNav } from "@/lib/navigation/auctionManagerNav";
import { superAdminNav } from "@/lib/navigation/superAdminNav";
import { useAuth } from "@/lib/auth/session-context";
import { useUnreadMessageCount } from "@/lib/hooks/useUnreadMessageCount";
import { useUnreadSupportTicketCount } from "@/lib/hooks/useUnreadSupportTicketCount";

interface AdminSidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
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

export function AdminSidebar({ isOpen, isMobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const unreadMsgCount = useUnreadMessageCount();
  const unreadTicketCount = useUnreadSupportTicketCount();

  const isStaff = !isLoading && session ? session.roles.some((role) => STAFF_ROLES.has(role)) : false;
  const isRestrictedStaff =
    !isLoading && session
      ? (session.roles.includes("auction_manager") || session.roles.includes("gemologist")) &&
        !session.roles.includes("super_admin")
      : false;
  const nav = isRestrictedStaff ? auctionManagerNav : superAdminNav;

  if (!isStaff) {
    return null;
  }

  function renderNav(showLabels: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((section) => (
          <div key={section.title} className="mb-5">
            {showLabels ? (
              <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const isMessages = item.href === "/admin/messages";
                const isSupport = item.href === "/help/contact";
                const badgeCount = isMessages ? unreadMsgCount : isSupport ? unreadTicketCount : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={showLabels ? undefined : item.label}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-600 dark:text-white"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                      } ${showLabels ? "" : "justify-center"}`}
                    >
                      {isMessages || isSupport ? (
                        <span className="relative shrink-0">
                          <item.icon size={18} />
                          {badgeCount > 0 ? (
                            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-danger-500 px-0.5 text-[9px] font-semibold text-white">
                              {badgeCount > 9 ? "9+" : badgeCount}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <item.icon size={18} className="shrink-0" />
                      )}
                      {showLabels ? <span>{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 bg-neutral-900/40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-md bg-brand-600" aria-hidden="true" />
            <span className="text-lg font-semibold text-neutral-900">Auction Platform</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>
        {renderNav(true, onCloseMobile)}
      </aside>

      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-neutral-200 bg-white transition-all duration-200 lg:flex ${
          isOpen ? "w-64" : "w-[72px]"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-neutral-200 px-4">
          <span className="h-6 w-6 shrink-0 rounded-md bg-brand-600" aria-hidden="true" />
          {isOpen ? <span className="text-lg font-semibold text-neutral-900">Auction Platform</span> : null}
        </div>
        {renderNav(isOpen)}
      </aside>
    </>
  );
}
