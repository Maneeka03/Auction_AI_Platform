"use client";

import Image from "next/image";
import { useBranding } from "@/lib/branding/branding-context";

interface BrandingLogoProps {
  showName?: boolean;
  className?: string;
}

export function BrandingLogo({ showName = true, className }: BrandingLogoProps) {
  const { platformName, logoUrl } = useBranding();

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={platformName}
          width={96}
          height={24}
          className="h-6 w-auto object-contain"
          unoptimized
        />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-md bg-brand-600" aria-hidden="true" />
      )}
      {showName ? (
        <span className="text-lg font-semibold text-neutral-900">{platformName}</span>
      ) : null}
    </div>
  );
}
