import { AgencyAdminShell } from "@/components/layout/AgencyAdminShell";
import type { ReactNode } from "react";

export default function AgencyAdminLayout({ children }: { children: ReactNode }) {
  return <AgencyAdminShell>{children}</AgencyAdminShell>;
}
