"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import type { Category, CategoryFieldInput, CategoryFieldType } from "@/types/category";

const FIELD_TYPES: { value: CategoryFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "boolean", label: "Yes / No" },
  { value: "date", label: "Date" },
];

interface FieldRow {
  label: string;
  field_type: CategoryFieldType;
  options: string;
  unit: string;
  required: boolean;
}

export interface CategoryFormPayload {
  name: string;
  group_label: string | null;
  fields: CategoryFieldInput[];
}

interface CategoryFormDrawerProps {
  category?: Category;
  parentName?: string;
  // Fields and group only apply to main categories; the page hides them for subcategories.
  showFields?: boolean;
  onClose: () => void;
  onSubmit: (payload: CategoryFormPayload) => Promise<void>;
}

const emptyField: FieldRow = { label: "", field_type: "text", options: "", unit: "", required: false };

export function CategoryFormDrawer({ category, parentName, showFields, onClose, onSubmit }: CategoryFormDrawerProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [groupLabel, setGroupLabel] = useState(category?.group_label ?? "");
  const [fields, setFields] = useState<FieldRow[]>(
    (category?.fields ?? []).map((f) => ({
      label: f.label,
      field_type: f.field_type,
      options: (f.options ?? []).join(", "),
      unit: f.unit ?? "",
      required: f.required,
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isEditing = Boolean(category);
  const title = isEditing ? "Edit Category" : parentName ? `Add Subcategory to ${parentName}` : "Add Main Category";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function updateField(idx: number, patch: Partial<FieldRow>) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        group_label: showFields ? groupLabel.trim() || null : null,
        fields: showFields
          ? fields
              .filter((f) => f.label.trim())
              .map((f) => ({
                label: f.label.trim(),
                field_type: f.field_type,
                options:
                  f.field_type === "select"
                    ? f.options.split(",").map((o) => o.trim()).filter(Boolean)
                    : undefined,
                unit: f.unit.trim() || undefined,
                required: f.required,
              }))
          : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Name <span className="text-danger-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Real Estate, Jewellery, Villas"
                autoFocus
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {showFields ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">Group (display header)</label>
                  <input
                    value={groupLabel}
                    onChange={(e) => setGroupLabel(e.target.value)}
                    placeholder="e.g. Vehicles & Transportation"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-800">
                      Fields <span className="text-xs font-normal text-neutral-400">(sellers fill these)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFields((prev) => [...prev, { ...emptyField }])}
                      className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100"
                    >
                      <Plus size={12} /> Add Field
                    </button>
                  </div>

                  {fields.length === 0 ? (
                    <p className="text-xs text-neutral-400">
                      Add fields like &quot;Carat&quot;, &quot;Square Feet&quot;, &quot;Make&quot; — each with an input type.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {fields.map((field, idx) => (
                        <div key={idx} className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 p-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={field.label}
                              onChange={(e) => updateField(idx, { label: e.target.value })}
                              placeholder="Label"
                              className="h-9 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                            />
                            <Select
                              value={field.field_type}
                              onChange={(v) => updateField(idx, { field_type: v as CategoryFieldType })}
                              options={FIELD_TYPES}
                              size="sm"
                              className="w-32"
                            />
                            <button
                              type="button"
                              onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            {field.field_type === "select" ? (
                              <input
                                value={field.options}
                                onChange={(e) => updateField(idx, { options: e.target.value })}
                                placeholder="Option1, Option2, Option3"
                                className="h-9 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                              />
                            ) : (
                              <input
                                value={field.unit}
                                onChange={(e) => updateField(idx, { unit: e.target.value })}
                                placeholder="Unit (e.g. sqft)"
                                className="h-9 flex-1 rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                              />
                            )}
                            <label className="flex items-center gap-1 px-1 text-xs text-neutral-600">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(idx, { required: e.target.checked })}
                                className="h-4 w-4 rounded border-neutral-300"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {error ? <p className="text-sm text-danger-600">{error}</p> : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
