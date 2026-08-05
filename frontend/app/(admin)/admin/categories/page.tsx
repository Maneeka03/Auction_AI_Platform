"use client";

import { ChevronDown, ChevronRight, FolderPlus, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PropertyRowMenu } from "@/components/properties/PropertyRowMenu";
import { CategoryFormDrawer } from "@/components/categories/CategoryFormDrawer";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api/categories";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Category, CategoryTree } from "@/types/category";

type DrawerState =
  | { mode: "create-main" }
  | { mode: "create-sub"; parent: CategoryTree }
  | { mode: "edit"; category: Category; parentName?: string }
  | null;

export default function CategoriesAdminPage() {
  const { accessToken } = useAuth();
  const { categories, isLoading, error, refetch } = useCategories();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleSubmit(name: string) {
    if (!accessToken || !drawer) return;

    if (drawer.mode === "create-main") {
      await createCategory(accessToken, { name });
    } else if (drawer.mode === "create-sub") {
      await createCategory(accessToken, { name, parent_id: drawer.parent.id });
    } else {
      await updateCategory(accessToken, drawer.category.id, { name });
    }

    setDrawer(null);
    void refetch();
  }

  async function handleDelete(category: Category) {
    if (!accessToken) return;
    const isMain = category.parent_id === null;
    const confirmed = window.confirm(
      isMain
        ? `Delete "${category.name}" and all its subcategories? This can't be undone.`
        : `Delete "${category.name}"? This can't be undone.`,
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteCategory(accessToken, category.id);
      void refetch();
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to delete category.",
      );
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="asset_management" need="full">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Categories</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Main categories and their subcategories, for any domain the platform auctions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refetch()}
                aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setDrawer({ mode: "create-main" })}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <Plus size={16} /> Add Main Category
              </button>
            </div>
          </div>

          {actionError ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{actionError}</p>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">Loading categories...</p>
            ) : error ? (
              <p className="px-4 py-8 text-center text-sm text-danger-600">{error}</p>
            ) : categories.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">
                No categories yet. Add a main category to get started.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {categories.map((main) => {
                  const isOpen = expandedId === main.id;
                  return (
                    <li key={main.id}>
                      {/* Main category row */}
                      <div className="flex items-center gap-2 p-4">
                        {/* Clickable toggle area */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(main.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          {isOpen ? (
                            <ChevronDown size={15} className="shrink-0 text-brand-500" />
                          ) : (
                            <ChevronRight size={15} className="shrink-0 text-neutral-400" />
                          )}
                          <span className="min-w-0 truncate font-medium text-neutral-900">
                            {main.name}
                          </span>
                          {main.children.length > 0 && (
                            <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                              {main.children.length}
                            </span>
                          )}
                        </button>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDrawer({ mode: "create-sub", parent: main })}
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                          >
                            <FolderPlus size={14} />
                            <span className="hidden sm:inline">Add Subcategory</span>
                          </button>
                          <PropertyRowMenu
                            onEdit={() => setDrawer({ mode: "edit", category: main })}
                            onDelete={() => void handleDelete(main)}
                          />
                        </div>
                      </div>

                      {/* Subcategory dropdown — shown only when expanded */}
                      {isOpen && (
                        <div className="border-t border-neutral-100 bg-neutral-50 px-4 pb-3 pt-2">
                          {main.children.length > 0 ? (
                            <ul className="max-h-52 overflow-y-auto rounded-lg border border-neutral-200 bg-white">
                              {main.children.map((sub) => (
                                <li
                                  key={sub.id}
                                  className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 last:border-0 hover:bg-neutral-50"
                                >
                                  <p className="text-sm text-neutral-700">{sub.name}</p>
                                  <PropertyRowMenu
                                    onEdit={() =>
                                      setDrawer({
                                        mode: "edit",
                                        category: sub,
                                        parentName: main.name,
                                      })
                                    }
                                    onDelete={() => void handleDelete(sub)}
                                  />
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="py-2 text-xs text-neutral-400">No subcategories yet.</p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {drawer ? (
          <CategoryFormDrawer
            category={drawer.mode === "edit" ? drawer.category : undefined}
            parentName={
              drawer.mode === "create-sub"
                ? drawer.parent.name
                : drawer.mode === "edit"
                ? drawer.parentName
                : undefined
            }
            onClose={() => setDrawer(null)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}
