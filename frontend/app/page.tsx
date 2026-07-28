"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { joinTenant } from "@/lib/api/auth";
import { discoverTenants, type TenantDiscoverOut } from "@/lib/api/discover";
import { useAuth } from "@/lib/auth/session-context";
import type { CategoryTree } from "@/types/category";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").padEnd(6, "0");
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function CategoryChip({
  category,
  color,
  onSelect,
}: {
  category: CategoryTree;
  color: string;
  onSelect: (categorySlug: string) => void;
}) {
  const [r, g, b] = hexToRgb(color);
  const hoverBg = `rgba(${r},${g},${b},0.08)`;

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => onSelect(category.slug)}
        className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-medium text-neutral-800 transition-all hover:shadow-sm"
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = hoverBg;
          el.style.borderColor = color;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = "";
          el.style.borderColor = "";
        }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="flex-1">{category.name}</span>
        {category.children.length > 0 && (
          <span className="text-xs text-neutral-400">{category.children.length} sub</span>
        )}
      </button>

      {category.children.length > 0 && (
        <div className="ml-5 flex flex-wrap gap-1.5">
          {category.children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.slug)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs text-neutral-600 transition-colors hover:bg-white"
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = color;
                el.style.color = color;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "";
                el.style.color = "";
              }}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TenantCard({
  tenant,
  isBuyerMode,
  joiningSlug,
  onSelect,
}: {
  tenant: TenantDiscoverOut;
  isBuyerMode: boolean;
  joiningSlug: string | null;
  onSelect: (slug: string, categorySlug?: string) => void;
}) {
  const [r, g, b] = hexToRgb(tenant.primary_color);
  const softBg = `rgba(${r},${g},${b},0.07)`;
  const isJoining = joiningSlug === tenant.slug;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1.5 w-full" style={{ backgroundColor: tenant.primary_color }} />

      <div className="flex flex-col gap-5 p-5">
        {/* Identity row */}
        <button
          type="button"
          onClick={() => onSelect(tenant.slug)}
          disabled={isJoining}
          className="group flex items-center gap-3 text-left disabled:opacity-70"
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-100"
            style={{ backgroundColor: softBg }}
          >
            {tenant.logo_url ? (
              <Image
                src={tenant.logo_url}
                alt={tenant.platform_name}
                width={48}
                height={48}
                className="h-full w-full object-contain p-1"
                unoptimized
              />
            ) : (
              <span className="text-base font-bold" style={{ color: tenant.primary_color }}>
                {initialsFromName(tenant.platform_name)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p
              className="truncate font-semibold text-neutral-900 group-hover:underline"
              style={{ textDecorationColor: tenant.primary_color }}
            >
              {tenant.platform_name}
            </p>
            <p className="text-xs text-neutral-400">/{tenant.slug}</p>
          </div>
          <span
            className="ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: softBg, color: tenant.primary_color }}
          >
            {isJoining ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Joining…
              </span>
            ) : isBuyerMode ? (
              "Join →"
            ) : (
              "Enter →"
            )}
          </span>
        </button>

        {/* Categories */}
        {tenant.categories.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Categories
            </p>
            <div className="space-y-1.5">
              {tenant.categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  category={cat}
                  color={tenant.primary_color}
                  onSelect={(catSlug) => onSelect(tenant.slug, catSlug)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs italic text-neutral-400">No categories listed yet.</p>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const { session, accessToken, refreshSession } = useAuth();
  const [tenants, setTenants] = useState<TenantDiscoverOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningSlug, setJoiningSlug] = useState<string | null>(null);

  useEffect(() => {
    discoverTenants()
      .then(setTenants)
      .catch(() => setError("Could not load platforms. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  // True when logged-in as buyer/seller (with or without an existing tenant)
  const isBuyer =
    !!session && session.roles.some((r) => r === "buyer" || r === "seller");
  const hasNoTenant = isBuyer && !session?.tenant_id;

  async function handleSelect(slug: string, _categorySlug?: string) {
    if (!session) {
      // Guest: go to login page
      router.push(`/${slug}/login`);
      return;
    }
    if (hasNoTenant && accessToken) {
      // First time: assign this buyer to the chosen tenant
      setJoiningSlug(slug);
      try {
        await joinTenant(accessToken, slug);
        await refreshSession();
        router.push(`/${slug}/properties`);
      } catch {
        setJoiningSlug(null);
        setError("Could not join this platform. Please try again.");
      }
    } else {
      // Already has a tenant (or is re-visiting): go directly to properties
      router.push(`/${slug}/properties`);
    }
  }

  const headingText = isBuyer ? "Choose your auction platform" : "Find your auction platform";
  const subText = isBuyer
    ? "Select a platform below to browse their listings and start bidding."
    : "Browse specialised auction houses. Pick a category or visit a platform to register and start bidding.";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-lg font-bold text-neutral-900">Auction Platform</p>
          {isBuyer ? (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
              Logged in — choose a platform
            </span>
          ) : (
            <p className="hidden text-sm text-neutral-400 sm:block">
              Choose a platform to get started
            </p>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-neutral-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {headingText}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-500">{subText}</p>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="mx-auto mt-4 max-w-6xl px-6">
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Platforms grid */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-medium text-neutral-600">No platforms available yet.</p>
            <p className="mt-1 text-sm text-neutral-400">Check back soon.</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-neutral-500">
              {tenants.length} platform{tenants.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  isBuyerMode={isBuyer}
                  joiningSlug={joiningSlug}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-neutral-100 py-8 text-center text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
      </footer>
    </div>
  );
}
