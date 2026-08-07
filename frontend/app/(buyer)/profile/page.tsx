"use client";

import { ProfileEditor } from "@/components/profile/ProfileEditor";

export default function BuyerProfilePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your account details.</p>
      </div>
      <ProfileEditor showStatus />
    </div>
  );
}
