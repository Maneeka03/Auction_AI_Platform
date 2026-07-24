import Link from "next/link";
import { Category } from "@/types/category";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/browse-assets?category=${category.slug}`}
       className="block h-full rounded-2xl border-t-8 border-purple-500 bg-white p-5 transition-all duration-300 hover:-translate-y-1 shadow-xl"
    >
      <h3 className="text-xl font-semibold">{category.name}</h3>
      <p className="mt-2 text-sm text-gray-500">
        Explore available assets
      </p>
      <span className="mt-6 inline-flex text-purple-600 font-medium">
        Browse →
      </span>
    </Link>
  );
}