"use client";

import {
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth/session-context";
import { agencyAdminNav } from "@/lib/navigation/agencyAdminNav";

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Sidebar({
  isOpen,
  isMobileOpen,
  onCloseMobile,
}: {
  isOpen: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  function renderNav(showLabels: boolean, onNavigate?: () => void) {
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {agencyAdminNav.map((section) => (
          <div key={section.title} className="mb-5">
            {showLabels ? (
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
                      onClick={onNavigate}
                      title={showLabels ? undefined : item.label}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-600 dark:text-white"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                      } ${showLabels ? "" : "justify-center"}`}
                    >
                      <item.icon size={18} className="shrink-0" />
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
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 dark:border-neutral-700 dark:bg-neutral-900 lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-md bg-violet-600" aria-hidden="true" />
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">Agency Admin</span>
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

      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-700 dark:bg-neutral-900 lg:flex ${
          isOpen ? "w-64" : "w-[72px]"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-neutral-200 px-4 dark:border-neutral-700">
          <span className="h-6 w-6 shrink-0 rounded-md bg-violet-600" aria-hidden="true" />
          {isOpen ? (
            <span className="text-lg font-semibold text-neutral-900 dark:text-white">Agency Admin</span>
          ) : null}
        </div>
        {renderNav(isOpen)}
      </aside>
    </>
  );
}

export function AgencyAdminShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  useEffect(() => {
    if (!profileOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const userInitials = session ? initialsFromName(session.full_name) : "?";

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-900 sm:px-6">
          <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />

            <div ref={profileRef} className="relative ml-1">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700"
              >
                {session?.avatar_url ? (
                  <img src={session.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  userInitials
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-success-500" />
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{session?.full_name}</p>
                    <p className="text-xs text-neutral-500">{session?.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      Agency Admin
                    </span>
                  </div>
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                  <Link
                    href="/agency-admin/super-admins"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    <Users size={16} /> Super Admins
                  </Link>
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
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
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
