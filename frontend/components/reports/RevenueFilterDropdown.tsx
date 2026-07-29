"use client";

import { Filter, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type RevenueSource = "auction" | "direct";

export interface RevenueFilters {
  sources: RevenueSource[];
}

export const EMPTY_REVENUE_FILTERS: RevenueFilters = { sources: [] };

interface RevenueFilterDropdownProps {
  filters: RevenueFilters;
  onChange: (filters: RevenueFilters) => void;
}

const SOURCE_OPTIONS: { value: RevenueSource; label: string }[] = [
  { value: "auction", label: "Auction Sales" },
  { value: "direct", label: "Direct Sales (Buy Now)" },
];

export function RevenueFilterDropdown({ filters, onChange }: RevenueFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pending, setPending] = useState<RevenueFilters>(filters);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setPending(filters);
  }, [isOpen, filters]);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleSource(source: RevenueSource) {
    setPending((prev) => ({
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  }

  function handleReset() {
    setPending(EMPTY_REVENUE_FILTERS);
  }

  function handleApply() {
    onChange(pending);
    setIsOpen(false);
  }

  const activeCount = filters.sources.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <Filter size={15} />
        Filter
        {activeCount > 0 ? (
          <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-xs font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] origin-top-left rounded-xl border border-neutral-200 bg-white shadow-lg transition-all duration-150 ease-out ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
              <Filter size={14} /> Filter
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Revenue Source
            </p>
            <div className="space-y-1.5 pb-1">
              {SOURCE_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={pending.sources.includes(option.value)}
                    onChange={() => toggleSource(option.value)}
                    className="h-3.5 w-3.5 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-neutral-100 p-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Filter
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}