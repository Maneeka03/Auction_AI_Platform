"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TicketStatus } from "@/types/supportTicket";

interface Option {
  value: TicketStatus;
  label: string;
  triggerClass: string;
  dotClass: string;
}

const OPTIONS: Option[] = [
  { value: "open",        label: "Open",        triggerClass: "border-blue-200 bg-blue-50 text-blue-600",       dotClass: "bg-blue-100" },
  { value: "in_progress", label: "In Progress", triggerClass: "border-amber-200 bg-amber-50 text-amber-700",    dotClass: "bg-amber-500" },
  { value: "resolved",    label: "Resolved",    triggerClass: "border-emerald-200 bg-emerald-50 text-emerald-700", dotClass: "bg-emerald-500" },
  { value: "closed",      label: "Closed",      triggerClass: "border-blue-700 bg-blue-600 text-white",         dotClass: "bg-white" },
];

interface Props {
  value: TicketStatus;
  onChange: (v: TicketStatus) => void;
  disabled?: boolean;
}

export function TicketStatusDropdown({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block w-full min-w-[130px]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${current.triggerClass} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${current.dotClass}`} />
          {current.label}
        </span>
        <ChevronDown size={13} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full min-w-[140px] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isSelected ? "bg-white" : opt.dotClass}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
