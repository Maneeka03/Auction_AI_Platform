"use client";

import { Home, LogOut, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/session-context";

const navLinks = [
  { label: "Browse Properties", href: "/properties", icon: Home },
  { label: "Wallet", href: "/wallet", icon: Wallet },
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

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-brand-600" aria-hidden="true" />
          <span className="text-lg font-semibold text-neutral-900">Auction Platform</span>
        </div>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
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

      <div className="flex items-center gap-3">
        {session ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
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
    </header>
  );
}