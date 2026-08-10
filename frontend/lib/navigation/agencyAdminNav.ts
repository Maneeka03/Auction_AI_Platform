import { LayoutDashboard, Users } from "lucide-react";
import type { NavSection } from "@/types/navigation";

export const agencyAdminNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/agency-admin/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Management",
    items: [{ label: "Super Admins", href: "/agency-admin/super-admins", icon: Users }],
  },
];
