"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export default function CustomSelect({ value, options, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition hover:border-brand-300 focus:border-brand-500 focus:outline-none"
      >
        {selected?.label ?? "Select"}
        <ChevronDown size={15} className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-xl">
          <div className="max-h-60 overflow-y-auto py-1.5">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition ${
                  option.value === value
                    ? "bg-brand-50 font-semibold text-brand-600"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {option.value === value && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}