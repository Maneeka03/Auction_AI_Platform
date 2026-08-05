"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 transition hover:border-brand-300 focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? "text-neutral-900" : "text-neutral-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-xl">
          {/* Search input */}
          <div className="border-b border-neutral-100 px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5">
              <Search size={13} className="shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-neutral-400">No results found</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition ${
                    option.value === value
                      ? "bg-brand-50 font-semibold text-brand-600"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {option.value === value && <Check size={13} className="shrink-0 text-brand-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
