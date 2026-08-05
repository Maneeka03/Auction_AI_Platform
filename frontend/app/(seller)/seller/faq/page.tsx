"use client";

import { useEffect, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { listPublicFaqs } from "@/lib/api/faqs";
import type { FAQ } from "@/types/faq";

export default function SellerFaqPage() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    listPublicFaqs()
      .then((page) => setItems(page.items))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
          <HelpCircle size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Frequently Asked Questions</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Answers to common questions about selling and listings.</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <HelpCircle size={28} className="mx-auto text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No FAQs published yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((faq) => (
            <div key={faq.id} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
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
          ))}
        </div>
      )}
    </div>
  );
}
