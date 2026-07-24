"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  itemLabelPlural?: string;
  className?: string;
}

function getPageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  const items: (number | "ellipsis")[] = [];
  const siblingCount = 1;
  const start = Math.max(2, page - siblingCount);
  const end = Math.min(totalPages - 1, page + siblingCount);

  items.push(1);
  if (start > 2) items.push("ellipsis");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 1) items.push("ellipsis");
  if (totalPages > 1) items.push(totalPages);

  return items;
}

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  itemLabel = "item",
  itemLabelPlural,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const pageItems = getPageItems(page, totalPages);

  function goTo(target: number) {
    const clamped = Math.min(totalPages, Math.max(1, target));
    if (clamped !== page) onPageChange(clamped);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span>
        Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of {total.toLocaleString()}{" "}
        {total === 1 ? itemLabel : (itemLabelPlural ?? `${itemLabel}s`)}
      </span>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1.5 text-neutral-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => goTo(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium",
                item === page
                  ? "bg-brand-500 text-white"
                  : "border border-neutral-200 text-neutral-700 hover:bg-neutral-50",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}