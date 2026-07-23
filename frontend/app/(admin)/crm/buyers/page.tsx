"use client";

import { Download, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { listBuyers } from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { exportToExcel } from "@/lib/utils/exportToExcel";
import type { BuyerCrmRow } from "@/types/crm";
import type { UserStatus } from "@/types/auth";

const STATUS_BADGE: Record<UserStatus, string> = {
  active: "bg-success-500/10 text-success-500",
  pending_verification: "bg-amber-500/10 text-amber-700",
  suspended: "bg-danger-500/10 text-danger-600",
  deleted: "bg-neutral-100 text-neutral-500",
};

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function BuyersCrmPage() {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [buyers, setBuyers] = useState<BuyerCrmRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuyers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listBuyers(accessToken, { page: 1, size: 100, search: search || undefined });
      setBuyers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load buyers.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, search]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchBuyers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchBuyers]);

  function handleExport() {
    exportToExcel(
      buyers.map((b) => ({
        Name: b.full_name,
        Email: b.email,
        Status: b.status,
        Bids: b.bids,
        "Auctions Won": b.auctions_won,
        "Properties Bought": b.properties_bought,
        Joined: new Date(b.created_at).toLocaleDateString(),
      })),
      "buyers",
      "Buyers",
    );
  }

  return (
    <AdminShell>
      <RequirePermission module="buyer_crm" need="view">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Buyers</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {total.toLocaleString()} registered buyer{total === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void fetchBuyers()}
                aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Bids</th>
                  <th className="px-4 py-3 font-medium">Auctions Won</th>
                  <th className="px-4 py-3 font-medium">Properties Bought</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      Loading buyers...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : buyers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      No buyers found.
                    </td>
                  </tr>
                ) : (
                  buyers.map((buyer) => (
                    <tr key={buyer.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {initialsFromName(buyer.full_name)}
                          </span>
                          <div>
                            <p className="font-medium text-neutral-900">{buyer.full_name}</p>
                            <p className="text-xs text-neutral-500">{buyer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[buyer.status]}`}>
                          {buyer.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{buyer.bids}</td>
                      <td className="px-4 py-3 text-neutral-600">{buyer.auctions_won}</td>
                      <td className="px-4 py-3 text-neutral-600">{buyer.properties_bought}</td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(buyer.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RequirePermission>
    </AdminShell>
  );
}