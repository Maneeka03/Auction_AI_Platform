"use client";

import { LayoutGrid, List } from "lucide-react";

export type LeadViewMode = "list" | "kanban";

interface ViewToggleProps {
  value: LeadViewMode;
  onChange: (value: LeadViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          value === "list" ? "bg-brand-500 text-white" : "text-neutral-500 hover:bg-neutral-100"
        }`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        aria-label="Card view"
        aria-pressed={value === "kanban"}
        className={`flex h-8 w-8 items-center justify-center rounded-md ${
          value === "kanban" ? "bg-brand-500 text-white" : "text-neutral-500 hover:bg-neutral-100"
        }`}
      >
        <LayoutGrid size={16} />
      </button>
    </div>
  );
}