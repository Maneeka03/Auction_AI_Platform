"use client";

import { BellOff, BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { disablePush, enablePush } from "@/lib/push";
import { useAuth } from "@/lib/auth/session-context";
import toast from "react-hot-toast";
type PushState = "unsupported" | "checking" | "denied" | "enabled" | "disabled";

async function getCurrentState(): Promise<PushState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  const permission = Notification.permission;
  if (permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "enabled" : "disabled";
}

export function PushEnableButton() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<PushState>("checking");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getCurrentState().then(setState);
  }, []);

  // async function toggle() {
  //   if (!accessToken || loading) return;
  //   setLoading(true);
  //   try {
  //     if (state === "enabled") {
  //       await disablePush(accessToken);
  //       setState("disabled");
  //     } else {
  //       const ok = await enablePush(accessToken);
  //       setState(ok ? "enabled" : "denied");
  //     }
  //   } catch {
  //     // silent
  //   } finally {
  //     setLoading(false);
  //   }
  // }
async function toggle() {
  if (!accessToken || loading) return;

  setLoading(true);

  try {
    if (state === "enabled") {
      await disablePush(accessToken);
      setState("disabled");

      toast.success("Push notifications disabled");
    } else {
      const ok = await enablePush(accessToken);

      if (ok) {
        setState("enabled");
        toast.success("Push notifications enabled");
      } else {
        setState("denied");
        toast.error("Notification permission denied");
      }
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update notification settings";

    toast.error(message);
  } finally {
    setLoading(false);
  }
}
  // Don't render while checking or if browser doesn't support it
  if (state === "checking" || state === "unsupported") return null;

  if (state === "denied") {
    return (
      <div
        title="Notifications blocked — open browser settings to allow them"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-300 cursor-not-allowed"
      >
        <BellOff size={16} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={loading}
      title={state === "enabled" ? "Disable browser notifications" : "Enable browser notifications"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        state === "enabled"
          ? "text-brand-600 hover:bg-brand-50"
          : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
      }`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : state === "enabled" ? (
        <>
          <BellRing size={16} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500" />
        </>
      ) : (
        <BellOff size={16} />
      )}
    </button>
  );
}
