"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import CategoryCard from "./CategoryCard";
import { listPublicCategories } from "@/lib/api/categories";
import { CategoryTree } from "@/types/category";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Categories(){

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const autoplay = useRef(Autoplay({delay: 2000, stopOnInteraction: false,stopOnMouseEnter: true,}));
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    loop: true,
  },[autoplay.current])

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await listPublicCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }
    loadCategories();
  }, []);

  return (
    <section className="relative z-20 pb-10 bg-white">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="mb-10">
            <span className="text-m font-bold uppercase tracking-[0.2em] text-brand-500">Categories</span>
            <h2 className="mt-2 text-4xl font-bold text-neutral-900">Browse Categories</h2>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => {emblaApi?.scrollPrev(); autoplay.current.reset();}}
              className="h-7 w-10 rounded-xl border shadow hover:bg-purple-600 hover:text-white transition">
              <ChevronLeft size={20}/>
            </button>
            <button onClick={() => {emblaApi?.scrollNext();autoplay.current.reset();}}
              className="h-7 w-10 mr-8 rounded-xl border shadow hover:bg-purple-600 hover:text-white transition">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="overflow-hidden pb-4 -mt-10" ref={emblaRef}>
          <div className="flex">
            {categories.map((category) => (
              <div key={category.id} className="flex-[0_0_25%] px-3">
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}