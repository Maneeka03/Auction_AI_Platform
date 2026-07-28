import Image from "next/image";
import Link from "next/link";
import { MapPin, BedDouble, Bath, Ruler } from "lucide-react";
import type { Property } from "@/types/property";

interface FeaturedAssetCardProps {
  property: Property;
}

export function FeaturedAssetCard({ property }: FeaturedAssetCardProps) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-60 overflow-hidden bg-neutral-100">
        {property.image_url ? (
          <Image src={property.image_url} alt={property.title} fill sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {property.category_name}
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white capitalize">
          {property.category_name}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-6 py-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-neutral-900">
            {property.title}
          </h3>
          <div className="mt-2" />
          <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{property.address}</span>
          </div>
        </div>
        <p className="mt-4 text-2xl font-bold tracking-tight text-brand-600">
          ${Number(property.reserve_price).toLocaleString()}
        </p>
        <button type="button" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-brand-500 py-2.5 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-500 hover:text-white">
          View Details
        </button>
      </div>
    </div>
  );
}