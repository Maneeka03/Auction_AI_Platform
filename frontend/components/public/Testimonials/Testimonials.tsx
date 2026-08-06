"use client";

import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";

const TESTIMONIALS = [
  {
    name: "Rachel M.",
    role: "Buyer",
    avatar: "/images/avatars/ann-mcclure.jpg",
    quote:
      "The bidding process was smooth and I always knew exactly where my funds stood. Closed my first purchase in under a week.",
  },
  {
    name: "David K.",
    role: "Buyer",
    avatar: "/images/avatars/john-doe.avif",
    quote:
      "Verification took a few minutes and after that I could bid on live auctions right from my phone. Straightforward experience.",
  },
  {
    name: "Priya S.",
    role: "Buyer",
    avatar: "/images/avatars/sarah-anderson.avif",
    quote:
      "Escrow protection made me comfortable bidding on a higher-value item for the first time. Everything closed exactly as expected.",
  },
  {
    name: "Rachl M.",
    role: "Buyer",
    avatar: "/images/avatars/thomas-william.avif",
    quote:
      "The bidding process was smooth and I always knew exactly where my funds stood. Closed my first purchase in under a week.",
  },
  {
    name: "Davidi K.",
    role: "Buyer",
    avatar: "/images/avatars/john-doe.avif",
    quote:
      "Verification took a few minutes and after that I could bid on live auctions right from my phone. Straightforward experience.",
  },
  {
    name: "Priy S.",
    role: "Buyer",
    avatar: "/images/avatars/sarah-anderson.avif",
    quote:
      "Escrow protection made me comfortable bidding on a higher-value item for the first time. Everything closed exactly as expected.",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Testimonials() {
  const autoplay = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      dragFree: false,
      loop: true,
    },
    [autoplay.current],
  );

  return (
    <section className="relative bg-white py-20">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
              Testimonials
            </span>

            <h2 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">
              What Buyers Are Saying
            </h2>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              onClick={() => {
                emblaApi?.scrollPrev();
                autoplay.current.reset();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:bg-purple-600 hover:text-white"
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => {
                emblaApi?.scrollNext();
                autoplay.current.reset();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:bg-purple-600 hover:text-white"
              aria-label="Next testimonials"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden pb-4" ref={emblaRef}>
          <div className="flex">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex-[0_0_100%] px-3 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <div className="flex h-full flex-col rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-lg">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400" />
                    ))}
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full">
                      {t.avatar ? (
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-fuchsia-600 to-violet-600 text-sm font-semibold text-white">
                          {initials(t.name)}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {t.name}
                      </p>
                      <p className="text-xs text-neutral-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
