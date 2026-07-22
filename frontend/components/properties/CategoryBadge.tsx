import { getCategoryColorClasses } from "@/lib/utils/categoryVisuals";

export function CategoryBadge({ categoryName }: { categoryName: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColorClasses(categoryName)}`}>
      {categoryName}
    </span>
  );
}