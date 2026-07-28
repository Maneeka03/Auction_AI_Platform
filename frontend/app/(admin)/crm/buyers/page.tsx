"use client";

<<<<<<< HEAD
import { Download, Plus, RefreshCw, Search } from "lucide-react";
=======
import { Download, RefreshCw, Search } from "lucide-react";
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Pagination } from "@/components/ui/Pagination";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { listBuyers } from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { exportToExcel } from "@/lib/utils/exportToExcel";
import type { BuyerCrmRow } from "@/types/crm";
import type { UserStatus } from "@/types/auth";
<<<<<<< HEAD
import { UserRowMenu } from "@/components/crm/UserRowMenu";
import { BuyerDetailsDrawer } from "@/components/crm/BuyerDetailsDrawer";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { updateUser } from "@/lib/api/admin";
import { AddBuyerDrawer } from "@/components/crm/AddBuyerDrawer";
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

const PAGE_SIZE = 10;

export default function BuyersCrmPage() {
  const { accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [buyers, setBuyers] = useState<BuyerCrmRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const [buyerToBlock, setBuyerToBlock] = useState<BuyerCrmRow | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [showAddBuyer, setShowAddBuyer] = useState(false);
=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3

  const fetchBuyers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
<<<<<<< HEAD
      const result = await listBuyers(accessToken, {
        page: 1,
        size: 100,
        search: search || undefined,
      });
      setBuyers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Failed to load buyers.",
      );
=======
      const result = await listBuyers(accessToken, { page: 1, size: 100, search: search || undefined });
      setBuyers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load buyers.");
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, search]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchBuyers(), 300);
    return () => clearTimeout(timeout);
  }, [fetchBuyers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

<<<<<<< HEAD
  const pagedBuyers = useMemo(
    () => buyers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [buyers, page],
  );
=======
  const pagedBuyers = useMemo(() => buyers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [buyers, page]);
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3

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

<<<<<<< HEAD
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerCrmRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleView = (buyer: BuyerCrmRow) => {
    setSelectedBuyer(buyer);
    setDrawerOpen(true);
  };
  const handleBlock = async () => {
    if (!buyerToBlock || !accessToken) return;
    try {
      setBlocking(true);
      await updateUser(accessToken, buyerToBlock.id, { status: "suspended" });
      setBuyerToBlock(null);
      await fetchBuyers();
    } catch (err) {
      console.error(err);
    } finally {
      setBlocking(false);
    }
  };

  const handleCreateBuyer = async (payload: {
    full_name: string;
    email: string;
    country?: string;
  }) => {
    if (!accessToken) return;

    await createUser(accessToken, {
      ...payload,
      roles: ["buyer"],
    });

    setShowAddBuyer(false);

    await fetchBuyers();
  };

=======
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
  return (
    <AdminShell>
      <RequirePermission module="buyer_crm" need="view">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
<<<<<<< HEAD
              <h1 className="text-2xl font-semibold text-neutral-900">
                Buyers
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {total.toLocaleString()} registered buyer
                {total === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
=======
              <h1 className="text-2xl font-semibold text-neutral-900">Buyers</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {total.toLocaleString()} registered buyer{total === 1 ? "" : "s"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
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
<<<<<<< HEAD

              <button
                type="button"
                onClick={() => setShowAddBuyer(true)}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <Plus size={16} />
                Add Buyer
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
                  <th className="px-4 py-3 font-medium">Bids</th>
                  <th className="px-4 py-3 font-medium">Auctions Won</th>
                  <th className="px-4 py-3 font-medium">Properties Bought</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
<<<<<<< HEAD
                  <th className="px-4 py-3 font-medium">Action</th>
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
                      Loading buyers...
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
                ) : buyers.length === 0 ? (
                  <tr>
<<<<<<< HEAD
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-neutral-500"
                    >
=======
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                      No buyers found.
                    </td>
                  </tr>
                ) : (
                  pagedBuyers.map((buyer) => (
<<<<<<< HEAD
                    <tr
                      key={buyer.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                    >
=======
                    <tr key={buyer.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {initialsFromName(buyer.full_name)}
                          </span>
                          <div>
<<<<<<< HEAD
                            <p className="font-medium text-neutral-900">
                              {buyer.full_name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {buyer.email}
                            </p>
=======
                            <p className="font-medium text-neutral-900">{buyer.full_name}</p>
                            <p className="text-xs text-neutral-500">{buyer.email}</p>
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
<<<<<<< HEAD
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[buyer.status]}`}
                        >
                          {buyer.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {buyer.bids}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {buyer.auctions_won}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {buyer.properties_bought}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(buyer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <UserRowMenu
                          onView={() => handleView(buyer)}
                          onBlock={() => setBuyerToBlock(buyer)}
                        />
                      </td>
=======
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[buyer.status]}`}>
                          {buyer.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{buyer.bids}</td>
                      <td className="px-4 py-3 text-neutral-600">{buyer.auctions_won}</td>
                      <td className="px-4 py-3 text-neutral-600">{buyer.properties_bought}</td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(buyer.created_at).toLocaleDateString()}</td>
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
            total={buyers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="buyer"
          />
        </div>
        <BuyerDetailsDrawer
          buyer={selectedBuyer}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedBuyer(null);
          }}
        />

        {showAddBuyer && (
          <AddBuyerDrawer
            onClose={() => setShowAddBuyer(false)}
            onCreate={handleCreateBuyer}
          />
        )}

        <ConfirmDialog
          open={!!buyerToBlock}
          title="Block Buyer"
          message={`Are you sure you want to block "${buyerToBlock?.full_name}"? This user will no longer be able to log in or participate in auctions.`}
          confirmText="Block Buyer"
          loading={blocking}
          onConfirm={handleBlock}
          onClose={() => setBuyerToBlock(null)}
        />
      </RequirePermission>
    </AdminShell>
  );
}
=======
          <Pagination page={page} total={buyers.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="buyer" />
        </div>
      </RequirePermission>
    </AdminShell>
  );
}
>>>>>>> 2981f801ee55426fcb4cf51912ac86a028d7ffa3
