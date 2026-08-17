// import { AgencyAdminShell } from "@/components/layout/AgencyAdminShell";
// import type { ReactNode } from "react";

// export default function AgencyAdminLayout({ children }: { children: ReactNode }) {
//   return <AgencyAdminShell>{children}</AgencyAdminShell>;
// }

// import { AdminSidebar } from "@/components/admin/AdminSidebar";
// import { AdminSidebar } from "@/components/layout/AdminSidebar";


// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
//       <AdminSidebar isOpen={true} isMobileOpen={false} onCloseMobile={() => {}} />

//       <main className="flex-1 p-6">
//         {children}
//       </main>
//     </div>
//   );
// }

import { AdminShell } from '@/components/layout/AdminShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}