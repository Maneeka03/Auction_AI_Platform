import { ArrowDownLeft, ArrowUpRight, Lock, ShoppingBag } from "lucide-react";
import type { WalletEntryKind } from "@/types/wallet";

const config: Record<WalletEntryKind, { icon: typeof ArrowUpRight; className: string }> = {
  deposit: { icon: ArrowUpRight, className: "bg-success-500/10 text-success-500" },
  refund: { icon: ArrowDownLeft, className: "bg-success-500/10 text-success-500" },
  bid_hold: { icon: Lock, className: "bg-amber-500/10 text-amber-600" },
  purchase: { icon: ShoppingBag, className: "bg-brand-500/10 text-brand-600" },
  withdrawal: { icon: ArrowDownLeft, className: "bg-danger-500/10 text-danger-600" },
};

export function TransactionIcon({ type }: { type: WalletEntryKind }) {
  const { icon: Icon, className } = config[type];
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
      <Icon size={16} />
    </span>
  );
}