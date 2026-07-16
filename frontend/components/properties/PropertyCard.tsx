import Image from "next/image";
import { Bath, Bed, Ruler } from "lucide-react";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  onBuyNow: (property: Property) => void;
}

export function PropertyCard({ property, onBuyNow }: PropertyCardProps) {
  const isAvailable = property.status === "available";

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="relative h-40 bg-neutral-100">
        {property.imageSrc ? (
          <Image src={property.imageSrc} alt={property.address} fill sizes="400px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {property.category} photo
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {property.category}
            </span>
            <h3 className="mt-1.5 text-sm font-semibold text-neutral-900">{property.address}</h3>
          </div>
        </div>

        <p className="mt-2 text-xl font-semibold text-neutral-900">${property.price.toLocaleString()}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          {property.bedrooms ? (
            <span className="flex items-center gap-1">
              <Bed size={13} /> {property.bedrooms} bd
            </span>
          ) : null}
          {property.bathrooms ? (
            <span className="flex items-center gap-1">
              <Bath size={13} /> {property.bathrooms} ba
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <Ruler size={13} /> {property.squareFeet.toLocaleString()} sqft
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{property.description}</p>

        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => onBuyNow(property)}
          className="mt-4 w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {isAvailable ? "Buy Now" : property.status === "pending" ? "Reserved" : "Sold"}
        </button>
      </div>
    </div>
  );
}