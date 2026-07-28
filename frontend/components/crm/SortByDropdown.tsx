"use client";

import { ArrowUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type SortOrder = "newest" | "oldest";

interface SortByDropdownProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

export function SortByDropdown({ value, onChange }: SortByDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <ArrowUpDown size={15} />
        Sort By
      </button>
      {isOpen ? (
        <div
          className={`absolute left-0 z-30 mt-2 w-40 origin-top-left rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg transition-all duration-150 ease-out ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {(["newest", "oldest"] as SortOrder[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                value === option ? "bg-brand-50 font-medium text-brand-700" : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {option === "newest" ? "Newest" : "Oldest"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}