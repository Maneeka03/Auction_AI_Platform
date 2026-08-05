"use client";

import { Pencil, Plus, Trash2, X, GripVertical } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createCategoryField,
  deleteCategoryField,
  listCategoryFields,
  updateCategoryField,
} from "@/lib/api/categories";
import { useAuth } from "@/lib/auth/session-context";
import type { CategoryField, CreateCategoryFieldRequest, FieldType } from "@/types/category";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes / No" },
  { value: "file", label: "File Upload" },
];

interface FieldFormState {
  label: string;
  field_type: FieldType;
  options: string;
  required: boolean;
  sort_order: number;
}

const EMPTY_FORM: FieldFormState = {
  label: "",
  field_type: "text",
  options: "",
  required: false,
  sort_order: 0,
};

interface Props {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}

export function CategoryFieldsDrawer({ categoryId, categoryName, onClose }: Props) {
  const { accessToken } = useAuth();
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const [form, setForm] = useState<FieldFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    void loadFields();
  }, []);

  async function loadFields() {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      setFields(await listCategoryFields(accessToken, categoryId));
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(field: CategoryField) {
    setForm({
      label: field.label,
      field_type: field.field_type,
      options: field.options ? field.options.join(", ") : "",
      required: field.required,
      sort_order: field.sort_order,
    });
    setEditingId(field.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setFormError(null);

    if (!form.label.trim()) {
      setFormError("Label is required.");
      return;
    }
    if (form.field_type === "dropdown" && !form.options.trim()) {
      setFormError("Dropdown options are required (comma-separated).");
      return;
    }

    const options =
      form.field_type === "dropdown"
        ? form.options.split(",").map((o) => o.trim()).filter(Boolean)
        : null;

    const payload: CreateCategoryFieldRequest = {
      label: form.label.trim(),
      field_type: form.field_type,
      options,
      required: form.required,
      sort_order: form.sort_order,
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateCategoryField(accessToken, categoryId, editingId, payload);
        setFields((prev) => prev.map((f) => (f.id === editingId ? updated : f)));
      } else {
        const created = await createCategoryField(accessToken, categoryId, payload);
        setFields((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(fieldId: string) {
    if (!accessToken) return;
    if (!confirm("Delete this field? Existing listings will keep their stored value.")) return;
    await deleteCategoryField(accessToken, categoryId, fieldId);
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Custom Fields</h2>
            <p className="mt-0.5 text-sm text-neutral-500">{categoryName}</p>
          </div>
          <button type="button" onClick={handleClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          {/* Field list */}
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading fields...</p>
          ) : fields.length === 0 && !showForm ? (
            <p className="text-sm text-neutral-400">No fields yet. Add one to get started.</p>
          ) : (
            <ul className="space-y-2">
              {fields.map((field) => (
                <li
                  key={field.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <GripVertical size={16} className="mt-0.5 shrink-0 text-neutral-300" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">{field.label}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                          {FIELD_TYPES.find((t) => t.value === field.field_type)?.label ?? field.field_type}
                        </span>
                        {field.required && (
                          <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-600">
                            Required
                          </span>
                        )}
                        {field.options && field.options.length > 0 && (
                          <span className="truncate text-xs text-neutral-400">
                            {field.options.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(field)}
                      className="rounded p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(field.id)}
                      className="rounded p-1.5 text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add / Edit form */}
          {showForm && (
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="mt-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-4"
            >
              <h3 className="text-sm font-semibold text-neutral-800">
                {editingId ? "Edit Field" : "New Field"}
              </h3>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">
                  Label <span className="text-danger-500">*</span>
                </label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Metal Type"
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-700">Field Type</label>
                <select
                  value={form.field_type}
                  onChange={(e) => setForm((f) => ({ ...f, field_type: e.target.value as FieldType }))}
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {form.field_type === "dropdown" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-700">
                    Options <span className="text-neutral-400">(comma-separated)</span>
                  </label>
                  <input
                    value={form.options}
                    onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                    placeholder="Gold, Silver, Platinum"
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
                    className="h-4 w-4 rounded border-neutral-300 accent-brand-500"
                  />
                  Required
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-neutral-500">Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="h-8 w-16 rounded-lg border border-neutral-200 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {formError && <p className="text-xs text-danger-600">{formError}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Add Field"}
                </button>
              </div>
            </form>
          )}

          {!showForm && (
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 w-full justify-center"
            >
              <Plus size={16} /> Add Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
