"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { CreateAuctionDrawer } from "@/components/auctions/CreateAuctionDrawer";
import { EditAuctionDrawer } from "@/components/auctions/EditAuctionDrawer";
import { createAuction, deleteAuction, endAuction, listAuctions, updateAuction } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction, AuctionStatus } from "@/types/auction";

type FilterTab = "all" | AuctionStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Ended" },
];

export default function LiveAuctionsPage() {
  const { accessToken, session } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);

  const canCreate = session ? can(session.permissions, "auction_management", "full") : false;

  const fetchAuctions = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listAuctions(accessToken, {
        page: 1,
        size: 50,
        status: activeTab === "all" ? undefined : activeTab,
      });
      setAuctions(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  async function handleCreate(payload: Parameters<typeof createAuction>[1]) {
    if (!accessToken) return;
    await createAuction(accessToken, payload);
    setShowCreateDrawer(false);
    void fetchAuctions();
  }

  async function handleSaveEdit(payload: Parameters<typeof updateAuction>[2]) {
    if (!accessToken || !editingAuction) return;
    await updateAuction(accessToken, editingAuction.id, payload);
    setEditingAuction(null);
    void fetchAuctions();
  }

  async function handleEndAuction(auction: Auction) {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `End "${auction.title}" now? This closes the auction with no sale and can't be undone.`,
    );
    if (!confirmed) return;
    await endAuction(accessToken, auction.id);
    void fetchAuctions();
  }

  async function handleDeleteAuction(auction: Auction) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Delete "${auction.title}"? This can't be undone.`);
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteAuction(accessToken, auction.id);
      void fetchAuctions();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to delete auction.");
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="auction_management" need="view">
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Live Auctions</h1>
              <p className="mt-1 text-sm text-neutral-600">All auctions across every stage.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void fetchAuctions()}
                aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              >
                <RefreshCw size={16} />
              </button>
              {canCreate ? (
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <Plus size={16} /> Create Auction
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-brand-500 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {actionError ? <p className="text-sm text-danger-600">{actionError}</p> : null}

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading auctions...</p>
          ) : error ? (
            <p className="text-sm text-danger-600">{error}</p>
          ) : auctions.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
              No auctions in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {auctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  canManage={canCreate}
                  onEdit={setEditingAuction}
                  onEndAuction={handleEndAuction}
                  onDelete={handleDeleteAuction}
                />
              ))}
            </div>
          )}
        </div>

        {showCreateDrawer ? (
          <CreateAuctionDrawer onClose={() => setShowCreateDrawer(false)} onCreate={handleCreate} />
        ) : null}
        {editingAuction ? (
          <EditAuctionDrawer
            auction={editingAuction}
            onClose={() => setEditingAuction(null)}
            onSave={handleSaveEdit}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}