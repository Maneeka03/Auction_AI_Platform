"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
import { listPublicFaqs } from "@/lib/api/faqs";
import type { FAQ } from "@/types/faq";

export default function FAQPage() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void listPublicFaqs()
      .then((page) => setItems(page.items))
      .finally(() => setIsLoading(false));
  }, []);

  const sections = useMemo(() => {
    const grouped = new Map<string, FAQ[]>();
    for (const faq of items) {
      const category = faq.category?.trim() || "General";
      grouped.set(category, [...(grouped.get(category) ?? []), faq]);
    }
    return [...grouped.entries()];
  }, [items]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />

      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
        <Image src="/images/property-detail/hero-bg.png" alt="" fill className="object-contain object-top" priority />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">Help &amp; FAQ</span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">Frequently Asked Questions</h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">Can&apos;t find your answer here? <Link href="/contact" className="underline underline-offset-2">Contact our team</Link> and we&apos;ll help.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        {isLoading ? (
          <p className="text-center text-sm text-neutral-500">Loading FAQs…</p>
        ) : sections.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">No FAQs published yet.</p>
        ) : (
          <div className="space-y-8">
            {sections.map(([category, faqs]) => (
              <div key={category} className="rounded-2xl border border-neutral-200 bg-white px-6 py-4 shadow-sm">
                <h2 className="mb-2 text-base font-bold text-brand-600">{category}</h2>
                {faqs.map((faq) => (
                  <div key={faq.id} className="border-b border-neutral-100 last:border-0">
                    <button type="button" onClick={() => setOpenId(openId === faq.id ? null : faq.id)} className="flex w-full items-start justify-between gap-4 py-4 text-left">
                      <span className="text-sm font-semibold text-neutral-900">{faq.question}</span>
                      <ChevronDown size={18} className={`shrink-0 text-neutral-400 transition-transform ${openId === faq.id ? "rotate-180" : ""}`} />
                    </button>
                    {openId === faq.id && <p className="pb-4 text-sm leading-relaxed text-neutral-600">{faq.answer}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
