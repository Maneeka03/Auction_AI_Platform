import { Gavel, Radio } from "lucide-react";

export function ActivityHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Gavel className="h-6 w-6 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Auction Activity
            </h1>

            <p className="text-muted-foreground">
              Monitor live auction activity across the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2">
        <Radio className="h-4 w-4 text-green-500 animate-pulse" />

        <span className="text-sm font-medium text-green-600">
          Live Monitoring
        </span>
      </div>
    </div>
  );
}