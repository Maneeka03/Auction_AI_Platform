"use client";

import { useEffect, useState } from "react";
import { listPublicProperties } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import type { Property } from "@/types/property";
import { FeaturedAssetCard } from "./FeaturedAssetCard";
import featuredBg from "@/public/images/featured-bg.png";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FeaturedAssets() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProperties() {
            try {
                const result = await listPublicProperties({page: 1,size: 4,});
                setProperties(result.items);
            } catch (err) {
                setError(err instanceof ApiRequestError? err.message: "Failed to load properties.");
            } finally {
                setLoading(false);
            }
        }
        void loadProperties();
    }, []);

    return (
        <section className="relative overflow-hidden py-20">
            <div className="absolute -top-32 left-0 w-full min-h-[900px] object-cover">
                <Image src={featuredBg} alt="" className="w-full h-full object-cover" priority/>
            </div>
            <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">Featured Assets</span>
                        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                            Explore Premium Properties
                        </h2>
                    </div>
                    <Link href="/browse-properties"
                        className="group inline-flex items-center gap-2 text-sm font-bold text-brand-500 transition-colors hover:text-brand-600"
                    >Browse All Properties
                        <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1"/>
                    </Link>
                </div>
                {loading ? ( <p className="text-neutral-500">Loading properties...</p>) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : properties.length === 0 ? (<p className="text-neutral-500">No featured properties available.</p>
                ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map((property) => (
                        <FeaturedAssetCard key={property.id} property={property} />
                    ))}
                </div>
            )}
        </div>
    </section>
  );
}
