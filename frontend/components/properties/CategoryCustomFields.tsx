"use client";

import { useEffect, useState } from "react";
import { listPublicCategoryFields } from "@/lib/api/categories";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { CategoryField } from "@/types/category";

interface Props {
  categoryId: string;
  parentCategoryId?: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function CategoryCustomFields({ categoryId, parentCategoryId, values, onChange }: Props) {
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) { setFields([]); return; }
    setIsLoading(true);
    const fetchAll = async () => {
      const parentFields =
        parentCategoryId && parentCategoryId !== categoryId
          ? await listPublicCategoryFields(parentCategoryId).catch(() => [])
          : [];
      const catFields = await listPublicCategoryFields(categoryId).catch(() => []);
      setFields([...parentFields, ...catFields]);
    };
    fetchAll().finally(() => setIsLoading(false));
  }, [categoryId, parentCategoryId]);

  if (!categoryId || isLoading) {
    return isLoading ? (
      <p className="text-xs text-neutral-400">Loading category fields...</p>
    ) : null;
  }

  if (fields.length === 0) return null;

  function set(label: string, value: string) {
    onChange({ ...values, [label]: value });
  }

  return (
    <div className="space-y-4 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        Category Details
      </p>
      {fields.map((field) => {
        const value = values[field.label] ?? "";
        const id = `cf-${field.id}`;
        const labelEl = (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-neutral-700">
            {field.label}
            {field.required && <span className="ml-1 text-danger-500">*</span>}
          </label>
        );

        if (field.field_type === "select" && field.options) {
          return (
            <div key={field.id}>
              {labelEl}
              <SearchableSelect
                value={value}
                options={[
                  { value: "", label: "Select…" },
                  ...field.options.map((opt) => ({ value: opt, label: opt })),
                ]}
                placeholder="Select…"
                onChange={(v) => set(field.label, v)}
              />
            </div>
          );
        }

        if (field.field_type === "boolean") {
          return (
            <div key={field.id} className="flex items-center gap-3">
              <input
                id={id}
                type="checkbox"
                checked={value === "true"}
                onChange={(e) => set(field.label, e.target.checked ? "true" : "false")}
                className="h-4 w-4 rounded border-neutral-300 accent-brand-500"
              />
              <label htmlFor={id} className="text-sm font-medium text-neutral-700 cursor-pointer">
                {field.label}
                {field.required && <span className="ml-1 text-danger-500">*</span>}
              </label>
            </div>
          );
        }

        if (field.field_type === "date") {
          return (
            <div key={field.id}>
              {labelEl}
              <input
                id={id}
                type="date"
                value={value}
                onChange={(e) => set(field.label, e.target.value)}
                required={field.required}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          );
        }

        if (field.field_type === "number") {
          return (
            <div key={field.id}>
              {labelEl}
              <input
                id={id}
                type="number"
                value={value}
                onChange={(e) => set(field.label, e.target.value)}
                required={field.required}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          );
        }

        if (field.field_type === "textarea") {
          return (
            <div key={field.id}>
              {labelEl}
              <textarea
                id={id}
                value={value}
                onChange={(e) => set(field.label, e.target.value)}
                required={field.required}
                rows={3}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          );
        }

        // default: text
        return (
          <div key={field.id}>
            {labelEl}
            <input
              id={id}
              type="text"
              value={value}
              onChange={(e) => set(field.label, e.target.value)}
              required={field.required}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        );
      })}
    </div>
  );
}
