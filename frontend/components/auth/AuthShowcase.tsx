"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const FLOATING_SHAPES = [
  { size: 140, left: "5%", duration: "9s", delay: "0s" },
  { size: 36, left: "22%", duration: "6s", delay: "3s" },
  { size: 100, left: "40%", duration: "10s", delay: "1.5s" },
  { size: 44, left: "58%", duration: "5.5s", delay: "4s" },
  { size: 120, left: "74%", duration: "8s", delay: "2s" },
  { size: 30, left: "88%", duration: "6.5s", delay: "5s" },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Buy and sell with confidence. Every listing on our platform is verified, authenticated, and backed by a team that knows what it's protecting.The verification process gave me real peace of mind",
    name: "Rosanna French",
    role: "Verified Buyer",
  },
  {
    quote:
      "The verification process gave me real peace of mind. I knew exactly what I was bidding on before I placed a single offer.The verification process gave me real peace of mind",
    name: "Marcus Webb",
    role: "Verified Seller",
  },
  {
    quote:
      "Escrow, KYC, provenance tracking — everything a serious collector needs is already built into the platform.The verification process gave me real peace of mind",
    name: "Aiko Tanaka",
    role: "Verified Buyer",
  },
];

export function AuthShowcase() {

const [activeIndex, setActiveIndex] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  }, 5000);
  return () => clearInterval(timer);
}, []);

const active = TESTIMONIALS[activeIndex];
  return (
    <div className="relative hidden overflow-hidden lg:block lg:flex-1">
        <Image src="/images/auth-showcase.avif" alt="" fill priority sizes="(min-width: 1024px) 60vw, 0vw" className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/90 via-brand-600/90 to-brand-900/95" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {FLOATING_SHAPES.map((shape, index) => (
                <span key={index} className="absolute bottom-0 animate-rise rounded-2xl bg-white/10"
                    style={{width: shape.size, height: shape.size, left: shape.left, animationDuration: shape.duration,animationDelay: shape.delay,}}
                />
            ))}
        </div>
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-12">
            <div className="max-w-2xl">
                {/* <span className="block text-left text-6xl font-bold leading-none text-success-500" aria-hidden="true">&ldquo;</span> */}
                <p key={activeIndex} className="mt-4 text-left text-xl font-medium text-white animate-slide-in">{active.quote}</p>
                <div className="mt-8 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-white/20" aria-hidden="true" />
                    <div className="text-left">
                        <p className="text-sm font-semibold text-white">{active.name}</p>
                        <p className="text-sm text-brand-200">{active.role}</p>
                    </div>
                </div>
                <div className="mt-10 flex items-center gap-2" aria-hidden="true">
                    {TESTIMONIALS.map((_, index) => (
                        <span key={index} className={`h-1 w-6 rounded-full transition-colors ${index === activeIndex ? "bg-white" : "bg-white/40"}`}/>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
}