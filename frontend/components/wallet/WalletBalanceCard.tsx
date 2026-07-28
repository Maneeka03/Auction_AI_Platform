import { Lock, Wallet } from "lucide-react";
import type { WalletSummary } from "@/types/wallet";

function fmt(value: string): string {
  return `$${Number(value).toLocaleString()}`;
}

export function WalletBalanceCard({ summary }: { summary: WalletSummary }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Wallet size={13} /> Available to Spend
          </div>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{fmt(summary.available)}</p>
          <p className="text-xs text-neutral-500">Usable for bids and purchases right now</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Lock size={13} /> Held for Active Bids
          </div>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{fmt(summary.held)}</p>
          <p className="text-xs text-neutral-500">Released automatically if you don&apos;t win</p>
        </div>

        <div>
          <p className="text-xs text-neutral-500">Wallet Balance</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{fmt(summary.balance)}</p>
          <p className="text-xs text-neutral-500">Total funds in your account</p>
        </div>
      </div>
    </div>
  );
}