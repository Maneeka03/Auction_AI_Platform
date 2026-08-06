import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Lock, ClipboardCheck, Users, Gavel, Globe } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
import Testimonials from "@/components/public/Testimonials/Testimonials";
 
const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust First",
    description: "Every buyer and seller completes identity verification before they can transact.",
  },
  {
    icon: Lock,
    title: "Secure by Design",
    description: "Funds are held in escrow until a transaction is confirmed on both sides.",
  },
  {
    icon: ClipboardCheck,
    title: "Reviewed Listings",
    description: "Every property is reviewed by our team before it's published or put up for auction.",
  },
  {
    icon: Globe,
    title: "Open Access",
    description: "Live auctions are open to verified buyers, wherever they're bidding from.",
  },
];
 
const STATS = [
  { value: "15K+", label: "Assets Listed" },
  { value: "500+", label: "Live Auctions" },
  { value: "99%", label: "Secure Deals" },
];
 
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
 
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
        <Image
          src="/images/property-detail/hero-bg.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
        />
        
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
              About Us
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              A Marketplace Built on Trust
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              We connect buyers and sellers through live auctions, backed by verification and
              secure, escrow-protected transactions at every step.
            </p>
          </div>
        </div>
      </section>
 
      <section className="py-24">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-16 px-8 lg:grid-cols-2">
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">Our Mission</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-neutral-900 md:text-4xl">
              Making Auctions Simple, Transparent, and Secure
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-neutral-600">
              Buying and selling at auction shouldn't require guesswork. Our platform brings
              verified buyers and sellers together in one place, with clear pricing, live bidding,
              and protections that give both sides confidence in every transaction.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-neutral-200 pt-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-extrabold text-brand-600">{stat.value}</p>
                  <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
 
         <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-fuchsia-500/15 to-violet-600/15 blur-2xl" />
            <Image
              src="/images/about/about.png"
              alt="An auctioneer presenting to a seated audience"
              width={750}
              height={563}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>
 
      {/* Values */}
      <section className="bg-neutral-50 py-20 ">
        <div className="mx-auto w-full max-w-[1600px] px-8">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">What We Value</span>
            <h2 className="mt-2 text-4xl font-bold text-neutral-900">The Principles Behind the Platform</h2>
          </div>
 
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                  className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/15 to-violet-600/15 text-brand-600">
                    <Icon size={26} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">{value.title}</h3>
                  <p className="mt-2 text-sm text-neutral-500">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Testimonials */}
      <Testimonials />
 
      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-[1600px] px-8">
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl px-10 py-24 text-center md:flex-row md:text-left">
            <Image src="/images/seller/call-bg.png" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-700/20 via-transparent to-transparent" />
 
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
              <p className="mt-2 text-purple-100">Browse live auctions or list your first property today.</p>
            </div>
            <div className="relative z-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/browse-properties"
                className="flex items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-violet-700 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <Users size={18} /> Browse Properties
              </Link>
              <Link
                href="/seller"
                className="flex items-center gap-2 rounded-full border-2 border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-violet-700"
              >
                <Gavel size={18} /> Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>
 
      <Footer />
    </div>
  );
}