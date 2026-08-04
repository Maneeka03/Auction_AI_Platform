"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    items: [
      {
        q: "Do I need to create an account to browse listings?",
        a: "You can browse all published listings without an account. However, to place a bid or make a purchase you must register and complete identity verification.",
      },
      {
        q: "How long does KYC verification take?",
        a: "Most verifications are completed within minutes. In some cases it may take up to 24 hours if additional document review is needed.",
      },
      {
        q: "Is there a fee to register?",
        a: "Registration is completely free. A small transaction fee is applied only when a sale is completed.",
      },
    ],
  },
  {
    section: "Buying & Bidding",
    items: [
      {
        q: "How do live auctions work?",
        a: "Live auctions run for a set duration. You can place bids in real time and the highest bid when the timer expires wins. You'll be notified immediately if you win.",
      },
      {
        q: "What happens if I'm outbid?",
        a: "You'll receive an instant notification. You can then place a higher bid before the auction closes.",
      },
      {
        q: "Can I buy an item without bidding?",
        a: "Yes. Items listed for direct sale have a reserve price. Click 'Buy Now' to purchase at that price without waiting for an auction to end.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept major credit and debit cards (Visa, Mastercard, Discover) and PayPal. Bank transfers are available for high-value transactions.",
      },
    ],
  },
  {
    section: "Selling",
    items: [
      {
        q: "How do I list an item for sale?",
        a: "Create a seller account, complete verification, then submit a listing. Our team reviews each listing before it goes live — typically within 2 business days.",
      },
      {
        q: "How do I set my reserve price?",
        a: "Our appraisal team can advise on realistic reserve prices based on recent comparable sales. You set the final price, but we'll flag if we think it's outside market range.",
      },
      {
        q: "When do I receive payment after a sale?",
        a: "Once the buyer confirms receipt of the item, funds held in escrow are released to your account within 2 business days.",
      },
    ],
  },
  {
    section: "Shipping & Delivery",
    items: [
      {
        q: "Who arranges shipping?",
        a: "The seller is responsible for packaging and dispatching the item using a tracked, insured courier within 3 business days of payment clearing.",
      },
      {
        q: "Is shipping included in the price?",
        a: "Shipping costs are displayed at checkout. International buyers are also responsible for any import duties or customs fees.",
      },
      {
        q: "What if my item arrives damaged?",
        a: "All shipments are insured. Contact our support team within 48 hours of delivery with photos and we'll open an insurance claim on your behalf.",
      },
    ],
  },
  {
    section: "Account & Security",
    items: [
      {
        q: "How is my payment information protected?",
        a: "All payment processing is PCI DSS–compliant. We never store raw card details on our servers.",
      },
      {
        q: "Can I change my email address or password?",
        a: "Yes. Visit Account Settings to update your credentials at any time. We recommend using a strong, unique password.",
      },
      {
        q: "What should I do if I suspect fraud?",
        a: "Contact our trust & safety team immediately at help@aucto.com. We investigate all reports within 24 hours.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-neutral-900">{q}</span>
        {open ? <ChevronUp size={18} className="shrink-0 text-brand-500" /> : <ChevronDown size={18} className="shrink-0 text-neutral-400" />}
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-neutral-600">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
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
              Help &amp; FAQ
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Can&apos;t find your answer here? <a href="/contact" className="underline underline-offset-2">Contact our team</a> and we&apos;ll help.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="space-y-8">
          {FAQ_SECTIONS.map((sec) => (
            <div key={sec.section} className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
              <h2 className="mb-2 text-base font-bold text-brand-600">{sec.section}</h2>
              {sec.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 p-8 text-center text-white">
          <h2 className="text-xl font-bold">Still need help?</h2>
          <p className="mt-2 text-purple-100">Our support team is available 24/7 via chat, email, or phone.</p>
          <a
            href="/contact"
            className="mt-5 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-700 transition hover:bg-purple-50"
          >
            Get in Touch
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
