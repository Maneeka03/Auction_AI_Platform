"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createSavedSearch, deleteSavedSearch, listSavedSearches } from "@/lib/api/savedSearches";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { SavedSearch } from "@/types/savedSearch";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function SavedSearchesPage() {
  const { accessToken } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    listSavedSearches(accessToken)
      .then(setSearches)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleSave() {
    if (!accessToken || !name.trim()) return;
    setSaving(true);
    try {
      const created = await createSavedSearch(accessToken, { name: name.trim() });
      setSearches((prev) => [created, ...prev]);
      setName("");
      setShowForm(false);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    try {
      await deleteSavedSearch(accessToken, id);
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Saved Searches</h1>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus size={15} /> Save Current Search
          </button>
        </div>

        {showForm ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-neutral-700">Name this search</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Antique watches under $5,000"
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!name.trim() || saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(""); }}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : searches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Search size={36} className="text-neutral-300" />
            <p className="text-sm text-neutral-500">No saved searches yet. Save a search to get notified about matching listings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-neutral-900">{s.name}</p>
                  <p className="text-xs text-neutral-400">Saved {formatDate(s.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(s.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
