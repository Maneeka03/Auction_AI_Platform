export function getWsBase(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.replace(/^http/, "ws");
  }
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/^http/, "ws");
  }
  return "ws://localhost:3000";
}
