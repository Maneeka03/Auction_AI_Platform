"use client";

import { FolderPlus, Plus, RefreshCw } from "lucide-react";
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Categories</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Main categories and their subcategories, for any domain the platform auctions.
              </p>
            </div>
            <div className="flex gap-2">
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
                {categories.map((main) => (
                  <li key={main.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-neutral-900">{main.name}</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDrawer({ mode: "create-sub", parent: main })}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                        >
                          <FolderPlus size={14} /> Add Subcategory
                        </button>
                        <PropertyRowMenu
                          onEdit={() => setDrawer({ mode: "edit", category: main })}
                          onDelete={() => void handleDelete(main)}
                        />
                      </div>
                    </div>

                    {main.children.length > 0 ? (
                      <ul className="mt-2.5 space-y-1 border-l border-neutral-100 pl-4">
                        {main.children.map((sub) => (
                          <li key={sub.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-neutral-50">
                            <p className="text-sm text-neutral-700">{sub.name}</p>
                            <PropertyRowMenu
                              onEdit={() => setDrawer({ mode: "edit", category: sub, parentName: main.name })}
                              onDelete={() => void handleDelete(sub)}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 pl-4 text-xs text-neutral-400">No subcategories yet.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {drawer ? (
          <CategoryFormDrawer
            category={drawer.mode === "edit" ? drawer.category : undefined}
            parentName={drawer.mode === "create-sub" ? drawer.parent.name : drawer.mode === "edit" ? drawer.parentName : undefined}
            onClose={() => setDrawer(null)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}