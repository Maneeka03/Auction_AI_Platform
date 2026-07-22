import Image from "next/image";
import { getCategoryIcon } from "@/lib/utils/categoryVisuals";

interface PropertyThumbnailProps {
  imageUrl: string | null;
  categoryName: string;
}

export function PropertyThumbnail({ imageUrl, categoryName }: PropertyThumbnailProps) {
  if (imageUrl) {
    return (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        <Image src={imageUrl} alt="" fill sizes="36px" unoptimized className="object-cover" />
      </span>
    );
  }

  const Icon = getCategoryIcon(categoryName);

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
      <Icon size={16} />
    </span>
  );
}