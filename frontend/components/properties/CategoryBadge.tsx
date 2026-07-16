import type { PropertyCategory } from "@/types/property";

const styles: Record<PropertyCategory, string> = {
  residential: "bg-brand-500/10 text-brand-600",
  commercial: "bg-amber-500/10 text-amber-600",
};

const labels: Record<PropertyCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

export function CategoryBadge({ category }: { category: PropertyCategory }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[category]}`}>{labels[category]}</span>
  );
}