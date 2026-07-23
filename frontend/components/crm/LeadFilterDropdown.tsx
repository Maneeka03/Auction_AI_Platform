"use client";

import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LeadStatus } from "@/types/crm";

export interface LeadFilters {
  statuses: LeadStatus[];
  sources: string[];
}

interface LeadFilterDropdownProps {
  filters: LeadFilters;
  /** Every distinct source currently in use across leads — grows automatically as new ones are typed on Add Lead. */
  availableSources: string[];
  onChange: (filters: LeadFilters) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export const EMPTY_LEAD_FILTERS: LeadFilters = { statuses: [], sources: [] };

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  // Collapsed by default — only opens when the user actually clicks it.
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="border-b border-neutral-100 py-2">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-1.5 px-1 py-1.5 text-sm font-medium text-neutral-800"
      >
        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        {title}
      </button>
      {isExpanded ? <div className="mt-1 px-1">{children}</div> : null}
    </div>
  );
}

export function LeadFilterDropdown({ filters, availableSources, onChange }: LeadFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pending, setPending] = useState<LeadFilters>(filters);
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

  function toggleStatus(status: LeadStatus) {
    setPending((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }

  function toggleSource(source: string) {
    setPending((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
  }

  function handleReset() {
    setPending(EMPTY_LEAD_FILTERS);
  }

  function handleApply() {
    onChange(pending);
    setIsOpen(false);
  }

  const activeCount = filters.statuses.length + filters.sources.length;

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
          className={`absolute left-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-left rounded-xl border border-neutral-200 bg-white shadow-lg transition-all duration-150 ease-out ${
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

          <div className="max-h-80 overflow-y-auto px-3 py-1">
            <CollapsibleSection title="Lead Status">
              <div className="space-y-1.5 pb-1">
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={pending.statuses.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                      className="h-3.5 w-3.5 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Source">
              <div className="space-y-1.5 pb-1">
                {availableSources.length === 0 ? (
                  <p className="text-xs text-neutral-400">No sources yet — add one from a lead.</p>
                ) : (
                  availableSources.map((source) => (
                    <label key={source} className="flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={pending.sources.includes(source)}
                        onChange={() => toggleSource(source)}
                        className="h-3.5 w-3.5 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                      />
                      {source}
                    </label>
                  ))
                )}
              </div>
            </CollapsibleSection>
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