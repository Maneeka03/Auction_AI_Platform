"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { enablePush } from "@/lib/push";
import { useAuth } from "@/lib/auth/session-context";

type State = "checking" | "unsupported" | "denied" | "enabled" | "disabled";

async function getState(): Promise<State> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "enabled" : "disabled";
}

export function NotificationPromptBanner() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<State>("checking");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getState().then(setState);
  }, []);

  async function handleEnable() {
    if (!accessToken || loading) return;
    setLoading(true);
    try {
      const ok = await enablePush(accessToken);
      setState(ok ? "enabled" : "denied");
    } catch {
      setState("denied");
    } finally {
      setLoading(false);
    }
  }

  if (state === "checking" || state === "unsupported" || state === "enabled") return null;
  if (dismissed) return null;

  if (state === "denied") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-amber-800">
          <BellOff size={13} className="shrink-0" />
          <span>
            Notifications are blocked.{" "}
            <strong>Open your browser&apos;s site settings</strong> and set Notifications to{" "}
            <strong>Allow</strong>, then refresh.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-500 hover:text-amber-700"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  // state === "disabled" — not yet asked or previously dismissed
  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-brand-800">
        <Bell size={13} className="shrink-0 text-brand-500" />
        <span>Enable notifications to get alerts for messages, bids, and auction updates.</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void handleEnable()}
          disabled={loading}
          className="rounded-md bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Enabling…" : "Enable"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-brand-400 hover:text-brand-600"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
