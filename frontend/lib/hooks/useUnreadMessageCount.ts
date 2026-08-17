import { useEffect, useState } from "react";
import { listNotifications } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/session-context";

const POLL_INTERVAL_MS = 30_000;

export function useUnreadMessageCount(): number {
  const { accessToken } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      setCount(0);
      return;
    }

    async function fetchCount() {
      try {
        const result = await listNotifications(accessToken!, { limit: 50 });
        const unread = result.items.filter(
          (n) => n.kind === "new_message" && !n.read_at,
        ).length;
        setCount(unread);
      } catch {}
    }

    void fetchCount();
    const interval = setInterval(() => void fetchCount(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [accessToken]);

  return count;
}
