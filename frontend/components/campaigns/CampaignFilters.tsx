// "use client";

// import { Search } from "lucide-react";
// import { SortByDropdown, type SortOrder } from "@/components/crm/SortByDropdown";
// import { DateRangeDropdown } from "@/components/crm/DateRangeDropdown";
// import type { DateRange } from "@/lib/utils/dateRangePresets";
// import { CampaignFilterDropdown, type CampaignFilters as CampaignFilterValues } from "./CampaignFilterDropdown";

// interface CampaignFiltersProps {
//   search: string;
//   onSearchChange: (value: string) => void;
//   sortOrder: SortOrder;
//   onSortChange: (value: SortOrder) => void;
//   dateRange: DateRange | null;
//   onDateRangeChange: (range: DateRange | null) => void;
//   filters: CampaignFilterValues;
//   onFiltersChange: (filters: CampaignFilterValues) => void;
// }

// export function CampaignFilters({
//   search,
//   onSearchChange,
//   sortOrder,
//   onSortChange,
//   dateRange,
//   onDateRangeChange,
//   filters,
//   onFiltersChange,
// }: CampaignFiltersProps) {
//   return (
//     <div className="flex flex-wrap items-center justify-between gap-3">
//       <div className="flex flex-wrap items-center gap-2">
//         <SortByDropdown value={sortOrder} onChange={onSortChange} />
//         <DateRangeDropdown range={dateRange} onChange={onDateRangeChange} />
//         <CampaignFilterDropdown filters={filters} onChange={onFiltersChange} />
//       </div>

//       <div className="relative w-full max-w-xs sm:w-80">
//         <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
//         <input
//           value={search}
//           onChange={(e) => onSearchChange(e.target.value)}
//           placeholder="Search campaigns..."
//           className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
//         />
//       </div>
//     </div>
//   );
// }
"use client";

import { Search } from "lucide-react";
import { SortByDropdown, type SortOrder } from "@/components/crm/SortByDropdown";
import { DateRangeDropdown } from "@/components/crm/DateRangeDropdown";
import type { DateRange } from "@/lib/utils/dateRangePresets";
import {
  CampaignFilterDropdown,
  type CampaignFilters as CampaignFilterValues,
} from "./CampaignFilterDropdown";

interface CampaignFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: SortOrder;
  onSortChange: (value: SortOrder) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  filters: CampaignFilterValues;
  onFiltersChange: (filters: CampaignFilterValues) => void;
}

export function CampaignFilters({
  search,
  onSearchChange,
  sortOrder,
  onSortChange,
  dateRange,
  onDateRangeChange,
  filters,
  onFiltersChange,
}: CampaignFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:w-80">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campaigns..."
          className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
    
      <div className="flex flex-wrap items-center gap-2">
        <SortByDropdown
          value={sortOrder}
          onChange={onSortChange}
        />

        <DateRangeDropdown
          range={dateRange}
          onChange={onDateRangeChange}
        />

        <CampaignFilterDropdown
          filters={filters}
          onChange={onFiltersChange}
        />
      </div>

    </div>
  );
}