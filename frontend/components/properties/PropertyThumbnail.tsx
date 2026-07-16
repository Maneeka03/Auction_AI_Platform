import Image from "next/image";
import { Building2, Home } from "lucide-react";
import type { PropertyCategory } from "@/types/property";

interface PropertyThumbnailProps {
  imageSrc?: string;
  category: PropertyCategory;
}

export function PropertyThumbnail({ imageSrc, category }: PropertyThumbnailProps) {
  if (imageSrc) {
    return (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        <Image src={imageSrc} alt="" fill sizes="36px" className="object-cover" />
      </span>
    );
  }

  const Icon = category === "Residential" ? Home : Building2;

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
      <Icon size={16} />
    </span>
  );
}