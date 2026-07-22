"use client";

import { Select } from "@/components/ui/Select";
import type { CategoryTree } from "@/types/category";

interface CategorySelectProps {
  categories: CategoryTree[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}

export function CategorySelect({ categories, value, onChange, disabled }: CategorySelectProps) {
  const selectedMain = categories.find(
    (main) => main.id === value || main.children.some((child) => child.id === value),
  );
  const selectedSub = selectedMain?.children.find((child) => child.id === value);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Main Category</label>
        <Select
          value={selectedMain?.id ?? ""}
          onChange={onChange}
          disabled={disabled}
          placeholder="Select category..."
          options={categories.map((main) => ({ value: main.id, label: main.name }))}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-neutral-500">Subcategory</label>
        <Select
          value={selectedSub?.id ?? ""}
          onChange={onChange}
          disabled={disabled || !selectedMain || selectedMain.children.length === 0}
          placeholder={selectedMain && selectedMain.children.length === 0 ? "None available" : "Optional"}
          options={(selectedMain?.children ?? []).map((child) => ({ value: child.id, label: child.name }))}
        />
      </div>
    </div>
  );
}