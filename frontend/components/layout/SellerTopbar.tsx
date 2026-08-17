"use client";

import { Gavel, Home, LogOut, Menu, Package, ShoppingBag, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PushEnableButton } from "@/components/notifications/PushEnableButton";
import { useAuth } from "@/lib/auth/session-context";

const navLinks = [
  { label: "Dashboard", href: "/seller/dashboard", icon: Home },
  { label: "My Listings", href: "/seller/listings", icon: Package },
  { label: "My Auctions", href: "/seller/auctions", icon: Gavel },
  { label: "Sales", href: "/seller/sales", icon: ShoppingBag },
  { label: "Escrow", href: "/seller/escrow", icon: Wallet },
];

function initialsFromName(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function SellerTopbar() {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="relative border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 md:gap-6">
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-md bg-brand-600" />
            <span className="hidden text-lg font-semibold text-neutral-900 sm:inline">Seller Portal</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <PushEnableButton />
          <NotificationBell />
          {session ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700" title={session.full_name}>
              {initialsFromName(session.full_name)}
            </span>
          ) : null}
          <button type="button" onClick={handleSignOut} className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100">
            <LogOut size={16} />
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <nav className="border-t border-neutral-200 bg-white px-4 py-2 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-50"}`}
              >
                <link.icon size={16} />{link.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
