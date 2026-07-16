"use client";

import {Bell,
  FileBarChart,
  Gavel,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Maximize2,
  Minimize2,
  MessageSquare,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/session-context";

type MenuKey = "apps" | "help" | "reports" | "messages" | "notifications" | "profile";

const appLinks = [
  { label: "Auctions", description: "Browse live and upcoming", href: "/dashboard", icon: Gavel },
  { label: "Listings", description: "Review submitted items", href: "/dashboard", icon: PackageSearch },
  { label: "Buyers", description: "Buyer directory", href: "/dashboard", icon: Users },
  { label: "Sellers", description: "Seller directory", href: "/dashboard", icon: UserCircle },
];

const initialNotifications = [
  {
    id: "notif-1",
    name: "John Doe",
    detail: "left 6 comments on the Q3 provenance report",
    time: "4 min ago",
    color: "bg-sky-100 text-sky-700",
    avatarSrc: "/images/avatars/john-doe.avif",
  },
  {
    id: "notif-2",
    name: "Thomas William",
    detail: "flagged a listing for review",
    time: "8 min ago",
    color: "bg-amber-100 text-amber-700",
    avatarSrc: "/images/avatars/thomas-william.avif",
  },
  {
    id: "notif-3",
    name: "Sarah Anderson",
    detail: "attached a certificate to Lot #142",
    time: "15 min ago",
    color: "bg-brand-100 text-brand-700",
    avatarSrc: "/images/avatars/sarah-anderson.avif",
  },
];

const initialMessages = [
  {
    id: "msg-1",
    name: "Ann McClure",
    detail: "mentioned you on Lot #142 verification",
    time: "20 min ago",
    color: "bg-success-500/15 text-success-500",
    avatarSrc: "/images/avatars/ann-mcclure.jpg",
  },
  {
    id: "msg-2",
    name: "Robert Chen",
    detail: "Any update on the reserve price?",
    time: "1 hr ago",
    color: "bg-danger-500/15 text-danger-600",
    avatarSrc: undefined,
  },
];

function PersonAvatar({ name, color, avatarSrc }: { name: string; color: string; avatarSrc?: string }) {
  if (avatarSrc) {
    return (
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-100">
        <Image src={avatarSrc} alt={name} fill sizes="32px" className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color}`}
    >
      {initialsFromName(name)}
    </span>
  );
}

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
}

export function AdminTopbar({ isSidebarOpen, onToggleSidebar }: AdminTopbarProps) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [messages, setMessages] = useState(initialMessages);
  const containerRef = useRef<HTMLElement>(null);

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }

  function dismissMessage(id: string) {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }

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
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
      >
        {isSidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
      </button>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>

        {/* <button
          type="button"
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button> */}

        {/* Apps quick-nav */}
        <div className="relative">
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
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
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
        <div className="relative">
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
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
              <Link href="/help/faq" onClick={() => setOpenMenu(null)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                FAQ
              </Link>
              <Link href="/help/contact" onClick={() => setOpenMenu(null)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                Contact Support
              </Link>
            </div>
          ) : null}
        </div>

        {/* Reports */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("reports")}
            aria-label="Reports"
            aria-expanded={openMenu === "reports"}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/15"
          >
            <FileBarChart size={17} />
          </button>
          {openMenu === "reports" ? (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
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
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("messages")}
            aria-label="Messages"
            aria-expanded={openMenu === "messages"}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            <MessageSquare size={17} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger-500" />
          </button>
          {openMenu === "messages" ? (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900">
                Messages
              </div>
              {messages.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-500">No new messages</p>
              ) : (
                <ul>
                  {messages.map((message) => (
                    <li
                      key={message.id}
                      className="group relative flex items-start gap-3 border-b border-neutral-50 px-4 py-3 last:border-0 hover:bg-neutral-50"
                    >
                      <PersonAvatar name={message.name} color={message.color} avatarSrc={message.avatarSrc} />
                      <div className="pr-5">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">{message.name}</span>{" "}
                          <span className="text-neutral-600">{message.detail}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">{message.time}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissMessage(message.id)}
                        aria-label={`Dismiss message from ${message.name}`}
                        className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-200 hover:text-neutral-700 group-hover:opacity-100"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("notifications")}
            aria-label="Notifications"
            aria-expanded={openMenu === "notifications"}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            <Bell size={17} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger-500" />
          </button>
          {openMenu === "notifications" ? (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-neutral-200 bg-white shadow-lg">
              <div className="border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900">
                Notifications
              </div>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-500">No new notifications</p>
              ) : (
                <ul>
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="group relative flex items-start gap-3 border-b border-neutral-50 px-4 py-3 last:border-0 hover:bg-neutral-50"
                    >
                      <PersonAvatar name={notification.name} color={notification.color} avatarSrc={notification.avatarSrc} />
                      <div className="pr-5">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">{notification.name}</span>{" "}
                          <span className="text-neutral-600">{notification.detail}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">{notification.time}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissNotification(notification.id)}
                        aria-label={`Dismiss notification from ${notification.name}`}
                        className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-200 hover:text-neutral-700 group-hover:opacity-100"
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/notifications"
                onClick={() => setOpenMenu(null)}
                className="block px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-neutral-50"
              >
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>

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
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-neutral-900">{userName}</p>
                <p className="text-xs text-neutral-500">{session?.email}</p>
              </div>
              <div className="my-1 border-t border-neutral-100" />
              <Link href="/settings/profile" onClick={() => setOpenMenu(null)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
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