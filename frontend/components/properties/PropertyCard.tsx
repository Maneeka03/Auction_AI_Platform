import Image from "next/image";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  onBuyNow: (property: Property) => void;
}

export function PropertyCard({ property, onBuyNow }: PropertyCardProps) {
  const isAvailable = property.status === "published";

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="relative h-40 bg-neutral-100">
        {property.image_url ? (
          <Image src={property.image_url} alt={property.title} fill sizes="400px" unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400 capitalize">
            {property.category} photo
          </div>
        )}
      </div>

      <div className="p-4">
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
          {property.category}
        </span>
        <h3 className="mt-1.5 text-sm font-semibold text-neutral-900">{property.title}</h3>
        <p className="text-xs text-neutral-500">{property.address}</p>

        <p className="mt-2 text-xl font-semibold text-neutral-900">
          ${Number(property.reserve_price).toLocaleString()}
        </p>

        {property.description ? (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-500">{property.description}</p>
        ) : null}

        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => onBuyNow(property)}
          className="mt-4 w-full rounded-lg bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {isAvailable ? "Buy Now" : property.status === "sold" ? "Sold" : "Not Yet Available"}
        </button>
      </div>
    </div>
  );
}