import { Lock, Wallet } from "lucide-react";
import type { WalletSummary } from "@/types/wallet";

export function WalletBalanceCard({ summary }: { summary: WalletSummary }) {
  const total = summary.balance + summary.pendingHolds;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Wallet size={13} /> Available Balance
          </div>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">${summary.balance.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">Usable for bids and purchases</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Lock size={13} /> Held for Active Bids
          </div>
          <p className="mt-1 text-2xl font-semibold text-amber-600">${summary.pendingHolds.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">Refunded automatically if you don&apos;t win</p>
        </div>

        <div>
          <p className="text-xs text-neutral-500">Total Wallet Value</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">${total.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">Balance + held funds</p>
        </div>
      </div>
    </div>
  );
}