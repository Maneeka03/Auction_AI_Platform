"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { useAuth } from "@/lib/auth/session-context";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", auction_manager: "Auction Manager", gemologist: "Appraiser / Gemologist",
  marketing: "Marketing", legal: "Legal", finance: "Finance", executive: "Executive",
};

export default function AdminProfilePage() {
  const { session } = useAuth();
  const roleLabel = session?.roles.map((role) => ROLE_LABELS[role] ?? role).join(", ");
  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">My Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">Manage your account details.</p>
        </div>
        <ProfileEditor roleLabel={roleLabel} />
      </div>
    </AdminShell>
  );
}
