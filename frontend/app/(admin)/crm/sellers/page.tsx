"use client";

<<<<<<< HEAD
import { Download, RefreshCw, Plus, Search } from "lucide-react";
=======
import { Download, RefreshCw, Search } from "lucide-react";
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Pagination } from "@/components/ui/Pagination";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { listSellers } from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { exportToExcel } from "@/lib/utils/exportToExcel";
import type { SellerCrmRow } from "@/types/crm";
import type { UserStatus } from "@/types/auth";
<<<<<<< HEAD
import { SellerDetailsDrawer } from "@/components/crm/SellerDetailsDrawer";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { updateUser } from "@/lib/api/admin";
import { UserRowMenu } from "@/components/crm/UserRowMenu";
import { AddSellerDrawer } from "@/components/crm/AddSellerDrawer";
import { createUser } from "@/lib/api/admin";
=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3

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

function formatMoney(value: string): string {
  return `$${Number(value).toLocaleString()}`;
}

const PAGE_SIZE = 10;

export default function SellersCrmPage() {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [sellers, setSellers] = useState<SellerCrmRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const [selectedSeller, setSelectedSeller] = useState<SellerCrmRow | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sellerToBlock, setSellerToBlock] = useState<SellerCrmRow | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [showAddSeller, setShowAddSeller] = useState(false);
=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3

  const fetchSellers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
<<<<<<< HEAD
      const result = await listSellers(accessToken, {
        page: 1,
        size: 100,
        search: search || undefined,
      });
      setSellers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to load sellers.",
      );
=======
      const result = await listSellers(accessToken, { page: 1, size: 100, search: search || undefined });
      setSellers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load sellers.");
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, search]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchSellers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchSellers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

<<<<<<< HEAD
  const pagedSellers = useMemo(
    () => sellers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sellers, page],
  );
=======
  const pagedSellers = useMemo(() => sellers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sellers, page]);
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3

  function handleExport() {
    exportToExcel(
      sellers.map((s) => ({
        Name: s.full_name,
        Email: s.email,
        Status: s.status,
        Listings: s.listings,
        Sold: s.sold,
        Payouts: Number(s.payouts),
        Joined: new Date(s.created_at).toLocaleDateString(),
      })),
      "sellers",
      "Sellers",
    );
  }

<<<<<<< HEAD
  function handleView(seller: SellerCrmRow) {
    setSelectedSeller(seller);
    setDrawerOpen(true);
  }

  async function handleBlock() {
    if (!sellerToBlock || !accessToken) return;

    try {
      setBlocking(true);

      await updateUser(accessToken, sellerToBlock.id, {
        status: "suspended",
      });

      setSellerToBlock(null);

      await fetchSellers();
    } catch (err) {
      console.error(err);
    } finally {
      setBlocking(false);
    }
  }

  const handleCreateSeller = async (payload: {
    full_name: string;
    email: string;
    country?: string;
  }) => {
    if (!accessToken) return;

    await createUser(accessToken, {
      ...payload,
      roles: ["seller"],
    });

    setShowAddSeller(false);

    await fetchSellers();
  };

=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
  return (
    <AdminShell>
      <RequirePermission module="seller_crm" need="view">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
<<<<<<< HEAD
              <h1 className="text-2xl font-semibold text-neutral-900">
                Sellers
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {total.toLocaleString()} registered seller
                {total === 1 ? "" : "s"}.
=======
              <h1 className="text-2xl font-semibold text-neutral-900">Sellers</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {total.toLocaleString()} registered seller{total === 1 ? "" : "s"}.
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void fetchSellers()}
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
<<<<<<< HEAD
              <button
                type="button"
                onClick={() => setShowAddSeller(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <Plus size={16} />
                Add Seller
              </button>
=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
            </div>
          </div>

          <div className="relative max-w-sm">
<<<<<<< HEAD
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
=======
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
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
                  <th className="px-4 py-3 font-medium">Listings</th>
                  <th className="px-4 py-3 font-medium">Sold</th>
                  <th className="px-4 py-3 font-medium">Payouts</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
<<<<<<< HEAD
                  <th className="px-4 py-3 font-medium">Actions</th>
=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
<<<<<<< HEAD
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                      Loading sellers...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
<<<<<<< HEAD
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-danger-600"
                    >
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-danger-600">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                      {error}
                    </td>
                  </tr>
                ) : sellers.length === 0 ? (
                  <tr>
<<<<<<< HEAD
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                      No sellers found.
                    </td>
                  </tr>
                ) : (
                  pagedSellers.map((seller) => (
<<<<<<< HEAD
                    <tr
                      key={seller.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                    >
=======
                    <tr key={seller.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {initialsFromName(seller.full_name)}
                          </span>
                          <div>
<<<<<<< HEAD
                            <p className="font-medium text-neutral-900">
                              {seller.full_name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {seller.email}
                            </p>
=======
                            <p className="font-medium text-neutral-900">{seller.full_name}</p>
                            <p className="text-xs text-neutral-500">{seller.email}</p>
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
<<<<<<< HEAD
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[seller.status]}`}
                        >
                          {seller.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {seller.listings}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {seller.sold}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatMoney(seller.payouts)}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(seller.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <UserRowMenu
                          onView={() => handleView(seller)}
                          onBlock={() => setSellerToBlock(seller)}
                        />
                      </td>
=======
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[seller.status]}`}>
                          {seller.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{seller.listings}</td>
                      <td className="px-4 py-3 text-neutral-600">{seller.sold}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatMoney(seller.payouts)}</td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(seller.created_at).toLocaleDateString()}</td>
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

<<<<<<< HEAD
          <Pagination
            page={page}
            total={sellers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="seller"
          />
        </div>
        <SellerDetailsDrawer
          seller={selectedSeller}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedSeller(null);
          }}
        />

        {showAddSeller && (
          <AddSellerDrawer
            onClose={() => setShowAddSeller(false)}
            onCreate={handleCreateSeller}
          />
        )}

        <ConfirmDialog
          open={!!sellerToBlock}
          title="Block Seller"
          message={`Are you sure you want to block "${sellerToBlock?.full_name}"? This user will no longer be able to log in or list properties.`}
          confirmText="Block Seller"
          loading={blocking}
          onConfirm={handleBlock}
          onClose={() => setSellerToBlock(null)}
        />
      </RequirePermission>
    </AdminShell>
  );
}
=======
          <Pagination page={page} total={sellers.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="seller" />
        </div>
      </RequirePermission>
    </AdminShell>
  );
}
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
