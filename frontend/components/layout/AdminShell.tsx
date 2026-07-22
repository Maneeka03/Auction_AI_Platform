"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex">
      <AdminSidebar
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <AdminTopbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
        />
        {children}
      </div>
    </div>
  );
}