"use client";

import { Bell } from "lucide-react";
import { PushEnableButton } from "@/components/notifications/PushEnableButton";

export default function SellerSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage your account preferences.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-6 py-4">
          <Bell size={16} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-800">Notifications</h2>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-800">Browser Push Notifications</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Receive real-time alerts for messages, listing status, and auction updates even when you're not on the page.
              </p>
            </div>
            <PushEnableButton />
          </div>
        </div>
      </div>
    </div>
  );
}
