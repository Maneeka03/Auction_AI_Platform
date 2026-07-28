"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import type { PermissionLevel, PermissionModule } from "@/types/auth";

interface RequirePermissionProps {
  module: PermissionModule;
  need: PermissionLevel;
  children: ReactNode;
}

export function RequirePermission({ module, need, children }: RequirePermissionProps) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (!can(session.permissions, module, need)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-500/10 text-danger-600">
          <ShieldAlert size={22} />
        </span>
        <h2 className="text-lg font-semibold text-neutral-900">You don't have access to this page</h2>
        <p className="max-w-sm text-sm text-neutral-500">
          This section requires a permission your account doesn't currently have. Contact an administrator if
          you think this is a mistake.
        </p>
        <Link href="/dashboard" className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}