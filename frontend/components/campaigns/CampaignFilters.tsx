"use client";

import { CalendarDays, ArrowUpDown, Funnel, Search, List, LayoutGrid } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  boardView: boolean;
  onToggleView: () => void;
}

export function CampaignFilters({
  search,
  onSearchChange,
  boardView,
  onToggleView,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">

      <div className="flex flex-wrap items-center gap-2">

        <button className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm">
          <ArrowUpDown size={16} />
          Sort By
        </button>

        <button className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm">
          <CalendarDays size={16} />
          All Time
        </button>

        <button className="flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm">
          <Funnel size={16} />
          Filter
        </button>

      </div>

      <div className="flex items-center gap-2">

        <div className="relative w-80">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search campaigns..."
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 outline-none focus:ring-2 focus:ring-brand-300"
          />

        </div>

        <button
          onClick={onToggleView}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-white"
        >
          {boardView ? <List size={18} /> : <LayoutGrid size={18} />}
        </button>

      </div>

    </div>
  );
}