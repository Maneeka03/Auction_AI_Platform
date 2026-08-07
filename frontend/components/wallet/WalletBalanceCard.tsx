import { CircleDollarSign, Lock, Wallet } from "lucide-react";
import type { WalletSummary } from "@/types/wallet";

function fmt(value: string): string {
  return `$${Number(value).toLocaleString()}`;
}

export function WalletBalanceCard({ summary }: { summary: WalletSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        { label: "Available to Spend", value: summary.available, description: "Usable for bids and purchases right now", icon: Wallet, accent: "bg-brand-500", valueClass: "text-neutral-900" },
        { label: "Held for Active Bids", value: summary.held, description: "Released automatically if you don&apos;t win", icon: Lock, accent: "bg-amber-500", valueClass: "text-amber-600" },
        { label: "Wallet Balance", value: summary.balance, description: "Total funds in your account", icon: CircleDollarSign, accent: "bg-success-500", valueClass: "text-neutral-900" },
      ].map(({ label, value, description, icon: Icon, accent, valueClass }) => (
        <div key={label} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className={`absolute left-0 top-0 h-11 w-11 ${accent}`} style={{ clipPath: "polygon(0 0, 100% 0, 0 65%)" }} aria-hidden="true" />
          <div className="flex items-center gap-2 pl-3 text-sm text-neutral-600"><Icon size={15} /> {label}</div>
          <p className={`mt-2 pl-3 text-2xl font-semibold ${valueClass}`}>{fmt(value)}</p>
          <p className="mt-1 pl-3 text-xs text-neutral-500">{description}</p>
        </div>
      ))}
      </div>
  );
}
