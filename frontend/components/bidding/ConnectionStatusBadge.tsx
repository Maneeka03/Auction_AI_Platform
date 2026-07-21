import type { ConnectionState } from "@/lib/hooks/useAuctionSocket";

const config: Record<ConnectionState, { label: string; className: string; pulse: boolean }> = {
  connecting: { label: "Connecting...", className: "bg-neutral-100 text-neutral-500", pulse: false },
  live: { label: "Live", className: "bg-success-500/10 text-success-500", pulse: true },
  reconnecting: { label: "Reconnecting...", className: "bg-amber-500/10 text-amber-600", pulse: false },
  polling: { label: "Updating periodically", className: "bg-sky-500/10 text-sky-600", pulse: false },
};

export function ConnectionStatusBadge({ state }: { state: ConnectionState }) {
  const { label, className, pulse } = config[state];
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}