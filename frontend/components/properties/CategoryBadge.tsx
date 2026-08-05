import { getCategoryColorClasses } from "@/lib/utils/categoryVisuals";

export function CategoryBadge({ categoryName }: { categoryName: string }) {
  // const display = categoryName.length >  ? categoryName.slice(0, 9) + "…" : categoryName;
  const display =
  categoryName.length > 9
    ? categoryName.slice(0, 9) + "…"
    : categoryName;
  return (
    <span
      title={categoryName}
      className={`inline-block max-w-[120px] rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryColorClasses(categoryName)}`}
    >
      {display}
    </span>
  );
}