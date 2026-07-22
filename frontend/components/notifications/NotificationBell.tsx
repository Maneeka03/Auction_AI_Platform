"use client";

import { Bell, CheckCheck, Gavel, ShieldCheck, Trophy, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { listNotifications, markNotificationsRead } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/session-context";
import type { Notification, NotificationKind } from "@/types/notification";

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  outbid: Gavel,
  auction_won: Trophy,
  auction_lost: Gavel,
  property_approved: CheckCheck,
  property_rejected: XCircle,
  kyc_reviewed: ShieldCheck,
};

const KIND_COLOR: Record<NotificationKind, string> = {
  outbid: "bg-amber-500/10 text-amber-600",
  auction_won: "bg-success-500/10 text-success-500",
  auction_lost: "bg-neutral-100 text-neutral-500",
  property_approved: "bg-success-500/10 text-success-500",
  property_rejected: "bg-danger-500/10 text-danger-600",
  kyc_reviewed: "bg-brand-500/10 text-brand-600",
};

function formatTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

const MENU_WIDTH = 340;
const MENU_HEIGHT_ESTIMATE = 420;

export function NotificationBell() {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  async function fetchNotifications() {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await listNotifications(accessToken, { limit: 20 });
      setNotifications(result.items);
      setUnread(result.unread);
    } catch {} 
    finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30000);
    return () => clearInterval(interval);
  }, [accessToken]);

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const opensUpward = rect.bottom + MENU_HEIGHT_ESTIMATE > window.innerHeight;
      setPosition({
        top: opensUpward ? Math.max(8, rect.top - MENU_HEIGHT_ESTIMATE) : rect.bottom + 8,
        left: Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8),
      });
    }
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleMarkAllRead() {
    if (!accessToken) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnread(0);
    try {
      await markNotificationsRead(accessToken);
    } catch {
      void fetchNotifications();
    }
  }

  async function handleMarkOneRead(notification: Notification) {
    if (!accessToken || notification.read_at) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationsRead(accessToken, { ids: [notification.id] });
    } catch {
      void fetchNotifications();
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
      >
        <Bell size={17} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH }}
              className="z-50 max-h-[28rem] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <p className="text-sm font-semibold text-neutral-900">Notifications</p>
                {unread > 0 ? (
                  <button
                    type="button"
                    onClick={() => void handleMarkAllRead()}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>

              <div className="max-h-[22rem] overflow-y-auto">
                {isLoading && notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-neutral-500">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-neutral-500">No notifications yet</p>
                ) : (
                  notifications.map((notification) => {
                    const Icon = KIND_ICON[notification.kind];
                    const isUnread = !notification.read_at;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleMarkOneRead(notification)}
                        className={`flex w-full items-start gap-3 border-b border-neutral-50 px-4 py-3 text-left last:border-0 hover:bg-neutral-50 ${
                          isUnread ? "bg-brand-50/40" : ""
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${KIND_COLOR[notification.kind]}`}
                        >
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm ${isUnread ? "font-medium text-neutral-900" : "text-neutral-600"}`}>
                            {notification.message}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-400">
                            {formatTime(notification.created_at)}
                          </span>
                        </span>
                        {isUnread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" /> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}