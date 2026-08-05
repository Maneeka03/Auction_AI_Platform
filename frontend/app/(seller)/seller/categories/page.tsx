"use client";

import { FolderPlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { createCategory, listCategories } from "@/lib/api/categories";
import { useAuth } from "@/lib/auth/session-context";
import type { CategoryTree } from "@/types/category";

interface CustomField {
  label: string;
  value: string;
}

interface CreatedCategory {
  name: string;
  subcategories: string[];
  fields: CustomField[];
}

export default function ProposeCategoryPage() {
  const { accessToken } = useAuth();

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [catName, setCatName] = useState("");
  const [parentId, setParentId] = useState("");
  const [subcatNames, setSubcatNames] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // History of categories proposed this session
  const [created, setCreated] = useState<CreatedCategory[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    listCategories(accessToken)
      .then(setCategories)
      .catch(() => null);
  }, [accessToken]);

  function addSubcat() {
    setSubcatNames((prev) => [...prev, ""]);
  }

  function updateSubcat(idx: number, val: string) {
    setSubcatNames((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function removeSubcat(idx: number) {
    setSubcatNames((prev) => prev.filter((_, i) => i !== idx));
  }

  function addField() {
    setCustomFields((prev) => [...prev, { label: "", value: "" }]);
  }

  function updateField(idx: number, key: keyof CustomField, val: string) {
    setCustomFields((prev) => prev.map((f, i) => (i === idx ? { ...f, [key]: val } : f)));
  }

  function removeField(idx: number) {
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function reset() {
    setCatName("");
    setParentId("");
    setSubcatNames([]);
    setCustomFields([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim() || !accessToken) return;
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const newCat = await createCategory(accessToken, {
        name: catName.trim(),
        parent_id: parentId || null,
      });

      const filledSubs = subcatNames.filter((n) => n.trim());
      await Promise.all(
        filledSubs.map((name) =>
          createCategory(accessToken, { name: name.trim(), parent_id: newCat.id }),
        ),
      );

      setCreated((prev) => [
        {
          name: catName.trim(),
          subcategories: filledSubs,
          fields: customFields.filter((f) => f.label.trim()),
        },
        ...prev,
      ]);

      // Refresh category list so the new entry shows in the dropdown
      listCategories(accessToken).then(setCategories).catch(() => null);

      setSuccess(`Category "${catName.trim()}" created successfully.`);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
          <FolderPlus size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Propose a Category</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Don&apos;t see the right category for your product? Create one here — it will be visible to
            admins and appear in Browse Categories.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category name */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">Category Details</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Vintage Watches"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Place under existing category{" "}
              <span className="text-xs font-normal text-neutral-400">(optional)</span>
            </label>
            <SearchableSelect
              value={parentId}
              options={[
                { value: "", label: "No parent — top-level category" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              placeholder="No parent — top-level category"
              onChange={(v) => {
                setParentId(v);
                if (v) setSubcatNames([]);
              }}
            />
          </div>
        </div>

        {/* Subcategories — only for top-level */}
        {!parentId && (
          <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-700">
                Subcategories{" "}
                <span className="text-xs font-normal text-neutral-400">(optional)</span>
              </h2>
              <button
                type="button"
                onClick={addSubcat}
                className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100"
              >
                <Plus size={12} /> Add Subcategory
              </button>
            </div>

            {subcatNames.length === 0 ? (
              <p className="text-xs text-neutral-400">
                Optionally add subcategories that will be nested under this category.
              </p>
            ) : (
              <div className="space-y-2">
                {subcatNames.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={name}
                      onChange={(e) => updateSubcat(idx, e.target.value)}
                      placeholder={`Subcategory ${idx + 1}`}
                      className="h-9 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubcat(idx)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom fields */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              Custom Product Fields{" "}
              <span className="text-xs font-normal text-neutral-400">(optional)</span>
            </h2>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100"
            >
              <Plus size={12} /> Add Field
            </button>
          </div>

          {customFields.length === 0 ? (
            <p className="text-xs text-neutral-400">
              Define fields like &quot;Material&quot;, &quot;Carat&quot;, &quot;Weight&quot; — these will be noted with your
              category proposal for admin reviewers.
            </p>
          ) : (
            <div className="space-y-2">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(idx, "label", e.target.value)}
                    placeholder="Field name (e.g. Material)"
                    className="h-9 w-2/5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                  <span className="text-neutral-400">:</span>
                  <input
                    value={field.value}
                    onChange={(e) => updateField(idx, "value", e.target.value)}
                    placeholder="Example value (e.g. 18K Gold)"
                    className="h-9 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={!catName.trim() || isCreating}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isCreating ? <Loader2 size={15} className="animate-spin" /> : <FolderPlus size={15} />}
            {isCreating ? "Creating…" : "Create Category"}
          </button>
        </div>
      </form>

      {/* Session history */}
      {created.length > 0 && (
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">Created This Session</h2>
          <ul className="space-y-3">
            {created.map((c, i) => (
              <li key={i} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-sm font-semibold text-neutral-800">{c.name}</p>
                {c.subcategories.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Subcategories: {c.subcategories.join(", ")}
                  </p>
                )}
                {c.fields.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Fields: {c.fields.map((f) => f.label).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
