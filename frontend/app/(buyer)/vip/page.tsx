"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Coins,
  Eye,
  Gift,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/lib/auth/session-context";
import { vipApi } from "@/lib/api/vip";
import type {
  VipProfile,
  VipTierInfo,
  VipTokenTransactionPage,
} from "@/types/vip";

export default function VipPage() {
  const { accessToken, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<VipProfile | null>(null);
  const [tiers, setTiers] = useState<VipTierInfo[]>([]);
  const [transactions, setTransactions] =
    useState<VipTokenTransactionPage | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tokenQuantity, setTokenQuantity] = useState(1);
  const [purchasingTokens, setPurchasingTokens] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState<string | null>(
    null,
  );

  async function loadData(token: string) {
    try {
      setLoading(true);
      setError(null);

      const [profileData, tiersData, transactionsData] = await Promise.all([
        vipApi.getProfile(token),
        vipApi.getTiers(),
        vipApi.getTransactions(token),
      ]);

      setProfile(profileData);
      setTiers(tiersData);
      setTransactions(transactionsData);
    } catch (err) {
      console.error("Failed to load VIP data", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load VIP data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!accessToken) {
      setLoading(false);
      setError("Please log in to view your VIP membership.");
      return;
    }

    void loadData(accessToken);
  }, [accessToken, authLoading]);

  async function handlePurchaseTokens() {
    if (!accessToken) {
      setError("Please log in first.");
      return;
    }

    if (tokenQuantity <= 0) {
      setError("Token quantity must be greater than zero.");
      return;
    }

    try {
      setPurchasingTokens(true);
      setError(null);

      const updatedProfile = await vipApi.purchaseTokens(
        accessToken,
        tokenQuantity,
      );

      setProfile(updatedProfile);

      const updatedTransactions = await vipApi.getTransactions(accessToken);
      setTransactions(updatedTransactions);

      setTokenQuantity(1);
    } catch (err) {
      console.error("Failed to purchase tokens", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to purchase tokens.",
      );
    } finally {
      setPurchasingTokens(false);
    }
  }

  async function handleMembership(tier: string) {
    if (!accessToken) {
      setError("Please log in first.");
      return;
    }

    try {
      setMembershipLoading(tier);
      setError(null);

      const updatedProfile = await vipApi.payMembership(
        accessToken,
        tier as VipProfile["tier"],
      );

      setProfile(updatedProfile);
    } catch (err) {
      console.error("Failed to purchase membership", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to purchase membership.",
      );
    } finally {
      setMembershipLoading(null);
    }
  }

  async function handleRefresh() {
    if (!accessToken) return;

    await loadData(accessToken);
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading VIP membership...</span>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <Crown className="mx-auto mb-4 h-12 w-12" />

          <h1 className="text-2xl font-bold">
            VIP Membership
          </h1>

          <p className="mt-2 text-muted-foreground">
            Please log in to view your VIP membership and token balance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Crown className="h-7 w-7" />

            <h1 className="text-3xl font-bold tracking-tight">
              VIP Membership
            </h1>
          </div>

          <p className="text-muted-foreground">
            Unlock exclusive auction benefits, viewing tokens and membership
            rewards.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>

            {accessToken && (
              <button
                type="button"
                onClick={() => void loadData(accessToken)}
                className="font-semibold underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile summary */}
      {profile && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Current Tier */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-muted p-3">
                  <Crown className="h-5 w-5" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current Tier
                </span>
              </div>

              <p className="text-2xl font-bold">
                {profile.tier_label}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                VIP membership level
              </p>
            </div>

            {/* Tokens */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-muted p-3">
                  <Coins className="h-5 w-5" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Token Balance
                </span>
              </div>

              <p className="text-2xl font-bold">
                {profile.token_balance.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Auction viewing tokens
              </p>
            </div>

            {/* Views */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-muted p-3">
                  <Eye className="h-5 w-5" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Item Views
                </span>
              </div>

              <p className="text-2xl font-bold">
                {profile.item_view_count.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Auction items viewed
              </p>
            </div>

            {/* Listings */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-xl bg-muted p-3">
                  <ShoppingBag className="h-5 w-5" />
                </div>

                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Listings
                </span>
              </div>

              <p className="text-2xl font-bold">
                {profile.listings_completed_count.toLocaleString()}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Completed listings
              </p>
            </div>
          </div>

          {/* Membership status */}
          <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    {profile.tier_label}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.tier === "NONE"
                      ? "Upgrade your membership to unlock VIP benefits."
                      : "Your VIP membership benefits are active."}
                  </p>

                  {profile.tier1_active && (
                    <p className="mt-2 text-sm font-medium">
                      Tier 1 membership is currently active.
                    </p>
                  )}
                </div>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground">
                  Free listing credits
                </p>

                <p className="text-xl font-bold">
                  {profile.free_listing_credits.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5" />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Free Listing Credits
                  </p>

                  <p className="text-xl font-bold">
                    {profile.free_listing_credits}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Return/Refund Requests Used
                  </p>

                  <p className="text-xl font-bold">
                    {profile.return_refund_requests_used}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5" />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Last Tier 1 Purchase
                  </p>

                  <p className="text-sm font-semibold">
                    {profile.tier1_last_purchase_at
                      ? new Date(
                          profile.tier1_last_purchase_at,
                        ).toLocaleDateString()
                      : "No purchase"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Buy tokens */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            Purchase Viewing Tokens
          </h2>

          <p className="text-sm text-muted-foreground">
            Tokens are used to view gated auction item details.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="tokenQuantity"
                className="mb-2 block text-sm font-medium"
              >
                Token quantity
              </label>

              <input
                id="tokenQuantity"
                type="number"
                min={1}
                max={10000}
                value={tokenQuantity}
                onChange={(event) =>
                  setTokenQuantity(Number(event.target.value))
                }
                className="w-full rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Maximum 10,000 tokens per purchase.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePurchaseTokens}
              disabled={purchasingTokens || tokenQuantity <= 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {purchasingTokens && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {purchasingTokens
                ? "Purchasing..."
                : "Purchase Tokens"}
            </button>
          </div>
        </div>
      </section>

      {/* Tier ladder */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            VIP Tier Ladder
          </h2>

          <p className="text-sm text-muted-foreground">
            Explore the requirements and benefits of each VIP tier.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tiers.map((tier) => {
            const isCurrent = profile?.tier === tier.tier;

            return (
              <div
                key={tier.tier}
                className={`rounded-2xl border bg-card p-6 shadow-sm ${
                  isCurrent ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />

                      <h3 className="text-lg font-bold">
                        {tier.label}
                      </h3>
                    </div>

                    {isCurrent && (
                      <span className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                        Current Tier
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Benefit
                    </p>

                    <p className="mt-1 text-sm">
                      {tier.benefit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Requirement
                    </p>

                    <p className="mt-1 text-sm">
                      {tier.requirement}
                    </p>
                  </div>
                </div>

                {tier.tier !== "NONE" && !isCurrent && (
                  <button
                    type="button"
                    onClick={() => void handleMembership(tier.tier)}
                    disabled={membershipLoading === tier.tier}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {membershipLoading === tier.tier && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {membershipLoading === tier.tier
                      ? "Processing..."
                      : `Choose ${tier.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Transactions */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            Token Transactions
          </h2>

          <p className="text-sm text-muted-foreground">
            Your recent VIP token activity.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {transactions?.items?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left font-semibold">
                      Type
                    </th>

                    <th className="px-5 py-4 text-left font-semibold">
                      Quantity
                    </th>

                    <th className="px-5 py-4 text-left font-semibold">
                      Balance After
                    </th>

                    <th className="px-5 py-4 text-left font-semibold">
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.items.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-5 py-4">
                        {new Date(
                          transaction.created_at,
                        ).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {transaction.kind}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {transaction.quantity}
                      </td>

                      <td className="px-5 py-4">
                        {transaction.balance_after}
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {transaction.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Coins className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

              <h3 className="font-semibold">
                No token transactions yet
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Your token purchases and usage will appear here.
              </p>
            </div>
          )}
        </div>

        {transactions && (
          <p className="mt-3 text-right text-xs text-muted-foreground">
            Showing {transactions.items.length} of{" "}
            {transactions.total} transactions
          </p>
        )}
      </section>
    </div>
  );
}