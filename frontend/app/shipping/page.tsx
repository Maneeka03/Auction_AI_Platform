import Image from "next/image";
import Link from "next/link";
import { Package, Truck, Globe, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Seller Confirms Asset",
    description: "Once payment clears escrow, the seller packages the item according to our packing guidelines and confirms dispatch within 3 business days.",
  },
  {
    icon: Package,
    title: "Tracked Dispatch",
    description: "All items are shipped with a tracked and insured courier. Tracking information is shared with the buyer automatically.",
  },
  {
    icon: Truck,
    title: "Insured in Transit",
    description: "Every shipment is fully insured for its sale value. In the rare event of loss or damage in transit, a claim is raised on your behalf.",
  },
  {
    icon: Globe,
    title: "International Delivery",
    description: "We support shipping to most countries. Import duties, taxes, and customs charges are the buyer's responsibility and vary by destination.",
  },
];

const TIMELINES = [
  { region: "Domestic (Same Country)", time: "3 – 7 business days" },
  { region: "Europe", time: "5 – 10 business days" },
  { region: "North America", time: "7 – 14 business days" },
  { region: "Asia Pacific", time: "10 – 21 business days" },
  { region: "Rest of World", time: "14 – 28 business days" },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
        Back to home
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
        <Image src="/images/property-detail/hero-bg.png" alt="" fill className="object-contain object-top" priority />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
              Shipping Information
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Safe Delivery, Every Time
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Every item shipped through Aucto is tracked, insured, and handled with care.
            </p>
          </div>
        </div>
      </section>

      {/* How shipping works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">How Shipping Works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {STEPS.map((step) => (
            <div key={step.title} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <step.icon size={22} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900">{step.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery timelines */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-bold text-neutral-900">Estimated Delivery Times</h2>
          <p className="mt-2 text-sm text-neutral-400">Times are estimates from date of dispatch and may vary due to customs clearance.</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-200">
            {TIMELINES.map((row, i) => (
              <div key={row.region} className={`flex items-center justify-between px-6 py-4 ${i % 2 === 0 ? "bg-neutral-50" : "bg-white"}`}>
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-800">{row.region}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-brand-500" />
                  <span className="text-sm font-semibold text-brand-600">{row.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <AlertCircle size={22} className="shrink-0 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900">International Buyers — Customs &amp; Duties</h3>
            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
              Import duties, VAT, and customs brokerage fees are the buyer&apos;s responsibility and are not included in the sale price or shipping cost.
              We recommend checking your country&apos;s import regulations before bidding on high-value items.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
