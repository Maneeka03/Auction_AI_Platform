"use client";

import { ArrowRight, Building2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { advanceEscrow, listEscrows } from "@/lib/api/escrow";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { mockEscrows } from "@/lib/mock/escrow";
import type { Escrow, EscrowState } from "@/types/escrow";

type FilterTab = "all" | EscrowState;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "funds_locked", label: "Funds Locked" },
  { key: "asset_held", label: "Asset Held" },
  { key: "authenticated", label: "Authenticated" },
  { key: "released", label: "Released" },
];

const STATE_LABEL: Record<EscrowState, string> = {
  funds_locked: "Funds Locked",
  asset_held: "Asset Held",
  authenticated: "Authenticated",
  released: "Released",
};

const STATE_BADGE: Record<EscrowState, string> = {
  funds_locked: "bg-amber-500/10 text-amber-700",
  asset_held: "bg-sky-500/10 text-sky-700",
  authenticated: "bg-purple-500/10 text-purple-700",
  released: "bg-success-500/10 text-success-500",
};

// Mirrors the backend's forward-only pipeline in services/escrow.py.
const NEXT_STATE: Partial<Record<EscrowState, EscrowState>> = {
  funds_locked: "asset_held",
  asset_held: "authenticated",
  authenticated: "released",
};

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString()}`;
}

export default function EscrowAdminPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  const fetchEscrows = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listEscrows(accessToken, {
        page: 1,
        size: 100,
        state: activeTab === "all" ? undefined : activeTab,
      });
      if (result.items.length === 0) {
        setEscrows(activeTab === "all" ? mockEscrows : mockEscrows.filter((e) => e.state === activeTab));
        setIsMockData(true);
      } else {
        setEscrows(result.items);
        setIsMockData(false);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load escrows.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => {
    void fetchEscrows();
  }, [fetchEscrows]);

  async function handleAdvance(escrow: Escrow) {
    if (!accessToken) return;
    const next = NEXT_STATE[escrow.state];
    if (!next) return;

    const confirmed = window.confirm(
      next === "released"
        ? `Release ${formatMoney(escrow.amount)} to the seller for "${escrow.property_title}"? This pays out immediately and can't be undone.`
        : `Move "${escrow.property_title}" from ${STATE_LABEL[escrow.state]} to ${STATE_LABEL[next]}?`,
    );
    if (!confirmed) return;

    setActionError(null);
    setAdvancingId(escrow.id);

    if (escrow.id.startsWith("mock-")) {
      // Demo data — simulate the transition locally instead of calling the real API.
      setEscrows((prev) =>
        prev.map((e) => (e.id === escrow.id ? { ...e, state: next, updated_at: new Date().toISOString() } : e)),
      );
      setAdvancingId(null);
      return;
    }

    try {
      await advanceEscrow(accessToken, escrow.id);
      void fetchEscrows();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to advance escrow.");
    } finally {
      setAdvancingId(null);
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="payment_escrow" need="full">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-neutral-900">Escrow</h1>
                {isMockData ? (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                    Demo Data
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                Every completed sale sits here until walked to Released, which pays the seller.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchEscrows()}
              aria-label="Refresh"
              className="flex h-10 w-10 items-center justify-center self-start rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "bg-brand-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {actionError ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{actionError}</p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">State</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      Loading escrows...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : escrows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                      No escrows in this state.
                    </td>
                  </tr>
                ) : (
                  escrows.map((escrow) => {
                    const next = NEXT_STATE[escrow.state];
                    return (
                      <tr key={escrow.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {escrow.property_image_url ? (
                              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                                <Image
                                  src={escrow.property_image_url}
                                  alt=""
                                  fill
                                  sizes="36px"
                                  unoptimized
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                                <Building2 size={16} />
                              </span>
                            )}
                            <span className="font-medium text-neutral-900">{escrow.property_title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{formatMoney(escrow.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATE_BADGE[escrow.state]}`}>
                            {STATE_LABEL[escrow.state]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {new Date(escrow.updated_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {next ? (
                            <button
                              type="button"
                              disabled={advancingId === escrow.id}
                              onClick={() => void handleAdvance(escrow)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                                next === "released"
                                  ? "bg-success-500 text-white hover:bg-success-600"
                                  : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                              }`}
                            >
                              {advancingId === escrow.id ? (
                                "Advancing..."
                              ) : (
                                <>
                                  {next === "released" ? "Release Funds" : STATE_LABEL[next]} <ArrowRight size={13} />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-400">Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RequirePermission>
    </AdminShell>
  );
}