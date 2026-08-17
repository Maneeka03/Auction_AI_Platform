"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
import { listPublicFaqs } from "@/lib/api/faqs";
import type { FAQ } from "@/types/faq";

export default function PublicFaqPage() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    listPublicFaqs()
      .then((page) => setItems(page.items))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />

      <section className="py-32">
        <div className="mx-auto w-full max-w-7xl px-8">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">Help</span>
            <h1 className="mt-2 text-4xl font-bold text-neutral-900">Frequently Asked Questions</h1>
          </div>

          <div className="mt-12 space-y-3">
            {isLoading ? (
              <p className="text-center text-sm text-neutral-500">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-sm text-neutral-500">No FAQs published yet.</p>
            ) : (
              items.map((faq) => (
                <div key={faq.id} className="rounded-xl border border-neutral-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-neutral-900">{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-neutral-400 transition-transform ${openId === faq.id ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openId === faq.id && (
                    <p className="border-t border-neutral-100 px-5 py-4 text-sm leading-relaxed text-neutral-600">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}