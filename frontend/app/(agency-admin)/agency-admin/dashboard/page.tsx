"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/session-context";

export default function AgencyDashboardPage() {
  const { session } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Welcome, {session?.full_name ?? "Agency Admin"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your super admin accounts from here. Each super admin operates independently with their own isolated data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/agency-admin/super-admins"
          className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <Users size={20} />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">Super Admins</p>
            <p className="mt-0.5 text-sm text-neutral-500">Create and manage super admin accounts</p>
          </div>
          <span className="text-sm font-medium text-violet-600 group-hover:underline">Manage →</span>
        </Link>
      </div>
    </div>
  );
}
