import type { ReactNode } from "react";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[560px] lg:shrink-0 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-brand-600" aria-hidden="true" />
            <span className="text-lg font-semibold text-neutral-900">Auction Platform</span>
          </div>
          {children}
        </div>
        <p className="absolute inset-x-0 bottom-10 text-center text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
        </p>
      </div>
      <AuthShowcase />
    </div>
  );
}