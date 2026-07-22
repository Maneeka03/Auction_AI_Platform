"use client";

import { Gavel, Home, LogOut, Menu, ShieldCheck, Wallet, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/auth/session-context";

const navLinks = [
  { label: "Browse Properties", href: "/properties", icon: Home },
  { label: "Live Auctions", href: "/live-auctions", icon: Gavel },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Verify ID", href: "/kyc", icon: ShieldCheck },
];

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function BuyerTopbar() {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            {isMobileNavOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-md bg-brand-600" aria-hidden="true" />
            <span className="hidden text-lg font-semibold text-neutral-900 sm:inline">Auction Platform</span>
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

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          {session ? (
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
              title={session.full_name}
            >
              {initialsFromName(session.full_name)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile nav sheet — drops down below the header, only below md */}
      {isMobileNavOpen ? (
        <nav className="border-t border-neutral-200 bg-white px-4 py-2 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileNavOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}