"use client";

import Link from "next/link";
import type { CategoryTree } from "@/types/category";

interface CategoryCardProps {
  category: CategoryTree;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <div className="h-full rounded-2xl border-t-8 border-purple-500 bg-white shadow-xl">
      <Link
        href={`/browse-properties?category=${category.id}`}
        className="flex h-full flex-col p-5 transition hover:-translate-y-0.5"
      >
        <h3 className="text-xl font-semibold transition hover:text-purple-600">
          {category.name}
        </h3>
        <p className="mt-2 text-sm text-gray-500">Explore available assets</p>
        <span className="mt-auto pt-4 font-medium text-purple-600">Browse</span>
      </Link>
    </div>
  );
}
