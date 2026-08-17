"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import CategoryCard from "./CategoryCard";
import { listPublicCategories } from "@/lib/api/categories";
import { CategoryTree } from "@/types/category";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const autoplay = useRef(Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", dragFree: false, loop: true },
    [autoplay.current],
  );

  useEffect(() => {
    async function loadCategories() {
      try {
        const data: CategoryTree[] = await listPublicCategories();
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setCategories(sorted);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  return (
    <section className="relative z-20 bg-white py-16">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
              Categories
            </span>
            <h2 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">
              Browse Categories
            </h2>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              onClick={() => { emblaApi?.scrollPrev(); autoplay.current.reset(); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:bg-purple-600 hover:text-white"
              aria-label="Previous categories"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => { emblaApi?.scrollNext(); autoplay.current.reset(); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:bg-purple-600 hover:text-white"
              aria-label="Next categories"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden pb-4" ref={emblaRef}>
          <div className="flex">
            {categories.map((category) => (
              <div key={category.id} className="flex-[0_0_100%] px-3 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%]">
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
