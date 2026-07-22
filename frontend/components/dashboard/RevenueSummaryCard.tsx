import { DollarSign } from "lucide-react";

export function RevenueSummaryCard({ total }: { total: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500/10 text-success-500">
          <DollarSign size={16} />
        </span>
        Total Revenue
      </div>
      <p className="mt-4 text-4xl font-semibold text-neutral-900">
        ${Number(total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Combined proceeds from auction awards and direct Buy Now purchases, all time
      </p>
    </div>
  );
}