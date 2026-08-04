import Image from "next/image";
import Link from "next/link";
import { UserCheck, Search, Gavel, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const STEPS = [
  {
    number: "01",
    icon: UserCheck,
    title: "Create & Verify Your Account",
    description:
      "Sign up in minutes. Complete our identity verification (KYC) so you can bid, buy, and sell with confidence. Verification protects every participant in the marketplace.",
  },
  {
    number: "02",
    icon: Search,
    title: "Browse & Discover",
    description:
      "Explore thousands of listed assets across Fine Jewellery, Antique Watches, Fine Art, Carpets & Textiles, and more. Use filters, price ranges, and categories to find exactly what you're looking for.",
  },
  {
    number: "03",
    icon: Gavel,
    title: "Bid or Buy Now",
    description:
      "Join live auctions in real time and place competitive bids, or purchase directly at the listed reserve price. Every item has been reviewed by our expert team before going live.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Secure Settlement",
    description:
      "Funds are held in escrow until both parties confirm the transaction. Once confirmed, the asset transfers to you and the seller receives payment — safe, transparent, and instant.",
  },
];

const FAQS = [
  {
    q: "Do I need to verify my identity to bid?",
    a: "Yes. All buyers and sellers must complete KYC verification before transacting. This keeps the platform safe for everyone.",
  },
  {
    q: "What happens if I win an auction?",
    a: "You'll be notified immediately. Funds held in escrow are released to the seller once you confirm receipt of the asset.",
  },
  {
    q: "Can I sell on the platform?",
    a: "Absolutely. Create a seller account, submit your listing, and our team will review it before it goes live.",
  },
  {
    q: "Are there any fees?",
    a: "A small transaction fee applies to completed sales. You'll see the exact fee breakdown before confirming any purchase.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
        Back to home
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
        <Image src="/images/property-detail/hero-bg.png" alt="" fill className="object-cover object-top" priority />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
              How It Works
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Buying & Selling Made Simple
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Four easy steps from account creation to secure settlement.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="space-y-12">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col gap-8 md:flex-row md:items-center ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-1 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black text-brand-100">{step.number}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                    <step.icon size={24} className="text-brand-600" />
                  </div>
                </div>
                <h2 className="mt-4 text-xl font-bold text-neutral-900">{step.title}</h2>
                <p className="mt-3 text-neutral-600 leading-relaxed">{step.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex md:shrink-0 md:items-center md:justify-center">
                  <ArrowRight size={28} className="text-brand-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold text-neutral-900">Common Questions</h2>
          <div className="mt-10 space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-neutral-200 p-6">
                <p className="font-semibold text-neutral-900">{faq.q}</p>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
