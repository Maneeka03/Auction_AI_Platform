"use client";

import { Select } from "@/components/ui/Select";
import type { CategoryField } from "@/types/category";

type Value = string | number | boolean | null;

interface Props {
  fields: CategoryField[];
  values: Record<string, Value>;
  onChange: (values: Record<string, Value>) => void;
}

// Renders a category's custom fields as inputs, keyed by field_key, so the seller's answers collect
// into one attributes object the listing is created with.
export function CategoryFieldsInput({ fields, values, onChange }: Props) {
  if (fields.length === 0) return null;

  function set(key: string, value: Value) {
    onChange({ ...values, [key]: value });
  }

  const base =
    "h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.field_key];
        return (
          <div key={field.id} className={field.field_type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {field.label}
              {field.unit ? <span className="text-neutral-400"> ({field.unit})</span> : null}
              {field.required ? <span className="text-red-500"> *</span> : null}
            </label>

            {field.field_type === "select" ? (
              <Select
                value={typeof value === "string" ? value : ""}
                onChange={(v) => set(field.field_key, v)}
                placeholder="Select..."
                options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
              />
            ) : field.field_type === "textarea" ? (
              <textarea
                value={typeof value === "string" ? value : ""}
                onChange={(e) => set(field.field_key, e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            ) : field.field_type === "boolean" ? (
              <label className="flex h-10 items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => set(field.field_key, e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Yes
              </label>
            ) : (
              <input
                type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                value={value == null ? "" : String(value)}
                onChange={(e) => set(field.field_key, e.target.value)}
                className={base}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
