"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CategoryTree } from "@/types/category";

interface CategoryCardProps {
  category: CategoryTree;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="h-full rounded-2xl border-t-8 border-purple-500 bg-white shadow-xl">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/browse-properties?category=${category.id}`}
            className="flex-1 transition hover:-translate-y-0.5"
          >
            <h3 className="text-xl font-semibold transition hover:text-purple-600">
              {category.name}
            </h3>
            <p className="mt-2 text-sm text-gray-500">Explore available assets</p>
            <span className="mt-4 inline-flex font-medium text-purple-600">Browse →</span>
          </Link>
          {hasChildren && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="mt-1 shrink-0 rounded p-1 text-neutral-400 transition hover:text-purple-600"
              aria-label={isExpanded ? "Collapse subcategories" : "Show subcategories"}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-4 space-y-1 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/browse-properties?category=${child.id}`}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-600 transition hover:bg-purple-50 hover:text-purple-700"
              >
                <span className="text-purple-400">›</span>
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
