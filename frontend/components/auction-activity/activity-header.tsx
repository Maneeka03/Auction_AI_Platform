import { Gavel, Radio } from "lucide-react";

export function ActivityHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
          <Gavel className="h-5 w-5 text-brand-600" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Auction Activity
          </h1>

          <p className="text-sm text-neutral-500">
            Monitor live auction activity across the platform.
          </p>
        </div>
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-success-500/20 bg-success-500/10 px-3.5 py-1.5">
        <Radio className="h-3.5 w-3.5 text-success-500 animate-pulse" />

        <span className="text-xs font-medium text-success-500">
          Live Monitoring
        </span>
      </div>
    </div>
  );
}