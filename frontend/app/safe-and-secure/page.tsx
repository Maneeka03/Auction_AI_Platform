import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Lock, UserCheck, Eye, FileCheck, CreditCard } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const FEATURES = [
  {
    icon: UserCheck,
    title: "Identity Verification (KYC)",
    description:
      "Every buyer and seller completes identity verification before their first transaction. We partner with leading KYC providers to validate government-issued IDs and prevent fraud.",
  },
  {
    icon: Lock,
    title: "Escrow-Protected Payments",
    description:
      "Funds are never sent directly to a seller. Payment is held in escrow until both parties confirm the transaction — protecting buyers from non-delivery and sellers from chargebacks.",
  },
  {
    icon: Eye,
    title: "Expert Listing Review",
    description:
      "Every item is reviewed by at least two qualified specialists before it's published. Counterfeit or misrepresented listings are rejected before they reach any buyer.",
  },
  {
    icon: FileCheck,
    title: "Provenance Documentation",
    description:
      "Sellers are required to upload supporting documentation — certificates, receipts, or appraisal reports — which are stored securely and made available to winning bidders.",
  },
  {
    icon: CreditCard,
    title: "PCI-Compliant Payments",
    description:
      "All payment data is handled by PCI DSS–compliant processors. We never store raw card numbers on our servers.",
  },
  {
    icon: ShieldCheck,
    title: "Dispute Resolution",
    description:
      "A dedicated trust & safety team handles disputes. If an item is significantly not as described, we work with both parties to reach a fair resolution, including full refunds where warranted.",
  },
];

const STATS = [
  { value: "99.8%", label: "Successful Transactions" },
  { value: "0", label: "Unresolved Fraud Cases" },
  { value: "24/7", label: "Security Monitoring" },
];

export default function SafeAndSecurePage() {
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
              Safe &amp; Secure
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Your Safety Is Our Priority
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Multiple layers of protection — for every buyer and every seller, every time.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 divide-x divide-neutral-100">
            {STATS.map((s) => (
              <div key={s.label} className="px-6 text-center">
                <p className="text-4xl font-black text-brand-600">{s.value}</p>
                <p className="mt-1 text-sm text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">How We Protect You</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <f.icon size={24} className="text-brand-600" />
              </div>
              <h3 className="mt-4 font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-fuchsia-600 to-violet-600 py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white">Still Have Questions?</h2>
          <p className="mt-3 text-purple-100">Our trust & safety team is available around the clock.</p>
          <a
            href="/contact"
            className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-700 transition hover:bg-purple-50"
          >
            Contact Us
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
