import { Building2, Car, Gem, Home, Package, Palette, type LucideIcon } from "lucide-react";

const ICON_KEYWORDS: [RegExp, LucideIcon][] = [
  [/residential|house|home|apartment|villa|condo/i, Home],
  [/real estate|commercial|land|plot|property/i, Building2],
  [/jewel|gem|ring|necklace|watch/i, Gem],
  [/art|painting|sculpture/i, Palette],
  [/vehicle|car|auto|motor/i, Car],
];

export function getCategoryIcon(categoryName: string): LucideIcon {
  const match = ICON_KEYWORDS.find(([pattern]) => pattern.test(categoryName));
  return match ? match[1] : Package;
}

const COLOR_PALETTE = [
  "bg-brand-500/10 text-brand-600",
  "bg-amber-500/10 text-amber-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-sky-500/10 text-sky-600",
  "bg-purple-500/10 text-purple-600",
  "bg-rose-500/10 text-rose-600",
];

export function getCategoryColorClasses(categoryName: string): string {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = (hash * 31 + categoryName.charCodeAt(i)) | 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}


export function isRealEstateCategory(mainCategoryName: string | undefined): boolean {
  return /real estate|residential|property/i.test(mainCategoryName ?? "");
}