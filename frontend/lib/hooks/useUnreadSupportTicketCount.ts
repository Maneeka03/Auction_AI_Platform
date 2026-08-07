"use client";

import { useEffect, useState } from "react";
import { listNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/session-context";

const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000").replace(/^http/, "ws");

export function useUnreadSupportTicketCount(): number {
  const { accessToken } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const page = await listNotifications(accessToken, { limit: 100, unreadOnly: true });
        if (active) setCount(page.items.filter((item) => item.kind === "support_ticket").length);
      } catch {
        if (active) setCount(0);
      }
    };
    void load();
    const ws = new WebSocket(`${WS_BASE}/api/v1/notifications/ws?token=${encodeURIComponent(accessToken)}`);
    ws.onmessage = () => void load();
    return () => {
      active = false;
      ws.close();
    };
  }, [accessToken]);

  return count;
}
