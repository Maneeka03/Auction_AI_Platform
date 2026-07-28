import type { ReactNode } from "react";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { BrandingLogo } from "@/components/branding/BrandingLogo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative flex w-full flex-col justify-center px-6 py-10 sm:px-12 lg:w-[560px] lg:shrink-0 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <BrandingLogo />
          </div>
          {children}
        </div>
        <p className="absolute inset-x-0 bottom-10 text-center text-xs text-neutral-400 ">
          &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
        </p>
      </div>
      <AuthShowcase />
    </div>
  );
}