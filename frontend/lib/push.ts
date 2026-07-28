// Web push client glue. Call enablePush(accessToken) from a UI toggle (e.g. after login or a
// "Turn on notifications" button) to register the device; disablePush to turn it off.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function api<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`push request failed: ${response.status}`);
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function enablePush(accessToken: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if ((await Notification.requestPermission()) !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const { public_key } = await api<{ public_key: string }>("/push/vapid-key", accessToken);
  if (!public_key) return false;

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key),
    }));

  await api("/push/subscribe", accessToken, {
    method: "POST",
    body: JSON.stringify(subscription.toJSON()),
  });
  return true;
}

export async function disablePush(accessToken: string): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await api("/push/unsubscribe", accessToken, {
    method: "POST",
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}
