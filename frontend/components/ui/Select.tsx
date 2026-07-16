"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  size?: "default" | "sm";
}

const sizeStyles: Record<NonNullable<SelectProps["size"]>, string> = {
  default: "h-11 px-3 text-sm bg-neutral-50 focus:bg-white",
  sm: "h-8 px-2.5 text-xs bg-white",
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled,
  className = "",
  id,
  size = "default",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border border-neutral-200 font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60 ${sizeStyles[size]}`}
      >
        <span className={selected ? "text-neutral-900" : "text-neutral-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {option.label}
              {option.value === value ? <Check size={14} className="text-brand-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}