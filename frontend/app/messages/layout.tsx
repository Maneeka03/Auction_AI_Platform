"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth/session-context";
import { BuyerShell } from "@/components/layout/BuyerShell";
import { SellerShell } from "@/components/layout/SellerShell";
import { AdminShell } from "@/components/layout/AdminShell";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Determine which shell to use based on user role
  const isSeller = session?.roles.includes("seller");
  const isBuyer = session?.roles.includes("buyer");
  const isAdmin = session?.roles.some((role) =>
    ["super_admin", "auction_manager", "marketing", "legal", "finance", "gemologist", "executive"].includes(role)
  );

  // Admin takes priority, then seller, then buyer
  if (isAdmin) {
    return <AdminShell>{children}</AdminShell>;
  }

  if (isSeller) {
    return <SellerShell>{children}</SellerShell>;
  }

  return <BuyerShell>{children}</BuyerShell>;
}
