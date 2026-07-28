"use client";

import { ArrowDown, ArrowUp, Check, ChevronDown, Eye, EyeOff, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { Button } from "@/components/ui/Button";
import {
  getSuperAdminSidebar,
  listSidebarItems,
  listSuperAdmins,
  saveSuperAdminSidebar,
} from "@/lib/api/agency";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { SidebarEntry, SidebarItem, SuperAdmin } from "@/types/agency";

// Merge catalogue + saved prefs into an ordered, complete list
function buildList(items: SidebarItem[], saved: SidebarEntry[]): SidebarEntry[] {
  const savedMap = new Map(saved.map((e) => [e.item_id, e]));
  const merged: SidebarEntry[] = items.map((item) => {
    const pref = savedMap.get(item.id);
    return {
      item_id: item.id,
      key: item.key,
      label: item.label,
      visible: pref?.visible ?? true,
      position: pref?.position ?? item.default_order,
    };
  });
  return merged.sort((a, b) => a.position - b.position);
}

// ── Super admin selector ──────────────────────────────────────────────────────

interface SelectorProps {
  selected: SuperAdmin | null;
  options: SuperAdmin[];
  onChange: (u: SuperAdmin) => void;
}

function SuperAdminSelector({ selected, options, onChange }: SelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-72">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm shadow-sm hover:border-neutral-300"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users size={15} className="shrink-0 text-neutral-400" />
          {selected ? (
            <span className="truncate font-medium text-neutral-900">{selected.full_name}</span>
          ) : (
            <span className="text-neutral-400">Select a super admin…</span>
          )}
        </div>
        <ChevronDown size={14} className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <p className="p-3 text-sm text-neutral-400">No super admins found.</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {options.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(u); setOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-neutral-50 ${
                      selected?.id === u.id ? "bg-brand-50 text-brand-700" : "text-neutral-700"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {u.full_name[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.full_name}</p>
                      <p className="truncate text-xs text-neutral-400">{u.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SidebarConfigPage() {
  const { accessToken } = useAuth();
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [selected, setSelected] = useState<SuperAdmin | null>(null);
  const [catalogueItems, setCatalogueItems] = useState<SidebarItem[]>([]);
  const [entries, setEntries] = useState<SidebarEntry[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load super admins + catalogue on mount
  useEffect(() => {
    if (!accessToken) return;
    setIsLoadingAdmins(true);
    Promise.all([
      listSuperAdmins(accessToken, { size: 100 }),
      listSidebarItems(accessToken),
    ])
      .then(([admins, items]) => {
        setSuperAdmins(admins.items);
        setCatalogueItems(items);
        if (admins.items.length > 0) setSelected(admins.items[0]);
      })
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : "Failed to load data.")
      )
      .finally(() => setIsLoadingAdmins(false));
  }, [accessToken]);

  // Reload sidebar entries when selected super admin changes
  const loadConfig = useCallback(async () => {
    if (!accessToken || !selected) return;
    setIsLoadingConfig(true);
    setError(null);
    try {
      const prefs = await getSuperAdminSidebar(accessToken, selected.id);
      setEntries(buildList(catalogueItems, prefs));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load sidebar config.");
    } finally {
      setIsLoadingConfig(false);
    }
  }, [accessToken, selected, catalogueItems]);

  useEffect(() => { void loadConfig(); }, [loadConfig]);

  function toggleVisible(itemId: string) {
    setEntries((prev) =>
      prev.map((e) => (e.item_id === itemId ? { ...e, visible: !e.visible } : e))
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((e, i) => ({ ...e, position: i }));
    });
  }

  function moveDown(index: number) {
    setEntries((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((e, i) => ({ ...e, position: i }));
    });
  }

  async function handleSave() {
    if (!accessToken || !selected) return;
    setSaveError(null);
    setIsSaving(true);
    setSaved(false);
    try {
      const updated = await saveSuperAdminSidebar(accessToken, selected.id, {
        items: entries.map((e) => ({ item_id: e.item_id, visible: e.visible })),
      });
      setEntries(updated.sort((a, b) => a.position - b.position));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiRequestError ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AgencyShell>
      <main className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Sidebar Configuration</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Configure which navigation items each super admin can see and in what order.
          </p>
        </div>

        {/* Super admin selector */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-medium text-neutral-700">Configure sidebar for:</p>
          {isLoadingAdmins ? (
            <div className="h-10 w-72 animate-pulse rounded-lg bg-neutral-100" />
          ) : (
            <SuperAdminSelector
              selected={selected}
              options={superAdmins}
              onChange={(u) => { setSelected(u); setSaved(false); }}
            />
          )}
        </div>

        {error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : !selected ? (
          <p className="text-sm text-neutral-400">Select a super admin to configure their sidebar.</p>
        ) : isLoadingConfig ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : (
          <div className="max-w-xl">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Order · Visibility — for {selected.full_name}
              </div>
              <ul className="divide-y divide-neutral-100">
                {entries.map((entry, index) => (
                  <li
                    key={entry.item_id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      entry.visible ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === entries.length - 1}
                        aria-label="Move down"
                        className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    <span className="w-5 text-center text-xs text-neutral-400">{index + 1}</span>
                    <span className="flex-1 text-sm font-medium text-neutral-900">{entry.label}</span>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-400">
                      {entry.key}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleVisible(entry.item_id)}
                      aria-label={entry.visible ? "Hide" : "Show"}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        entry.visible
                          ? "text-brand-600 hover:bg-brand-50"
                          : "text-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {entry.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {saveError ? <p className="mt-3 text-sm text-danger-600">{saveError}</p> : null}

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleSave} isLoading={isSaving} disabled={!selected} className="w-auto">
                Save Configuration
              </Button>
              {saved ? (
                <span className="flex items-center gap-1 text-sm text-success-500">
                  <Check size={14} strokeWidth={2.5} /> Saved
                </span>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </AgencyShell>
  );
}
