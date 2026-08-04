"use client";

import Image from "next/image";
// import { Phone, Mail, MapPin, Clock, Send, Link } from "lucide-react";
import NextLink from "next/link";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const CONTACT_INFO = [
  { icon: Phone, label: "Phone", value: "+1 (000) 000-0000", sub: "Mon – Fri, 9 am – 6 pm" },
  { icon: Mail, label: "Email", value: "help@aucto.com", sub: "We reply within 24 hours" },
  { icon: MapPin, label: "Address", value: "Democountry, AB", sub: "Head Office" },
  { icon: Clock, label: "Support Hours", value: "24 / 7 Online", sub: "Live chat & ticket system" },
];

const TOPICS = [
  "General Enquiry",
  "Buying & Bidding",
  "Selling & Listings",
  "Payment & Escrow",
  "Shipping & Delivery",
  "Account & Verification",
  "Press & Media",
  "Other",
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />
<NextLink
  href="/"
  className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
>
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6"/>
  </svg>
  Back to home
</NextLink>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
        <Image src="/images/property-detail/hero-bg.png" alt="" fill className="object-cover object-top" priority />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
              Contact Us
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              We&apos;d Love to Hear From You
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Reach out anytime — our team usually replies within one business day.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
          {/* Contact form */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Send size={28} className="text-green-600" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-neutral-900">Message Received</h2>
                <p className="mt-2 text-neutral-500">Thanks for reaching out. We&apos;ll get back to you within 24 hours.</p>
                <button
                  type="button"
                  onClick={() => { setSent(false); setForm({ name: "", email: "", topic: "", message: "" }); }}
                  className="mt-6 rounded-full border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-neutral-900">Send a Message</h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700">Your Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="Jane Smith"
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700">Email Address</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="jane@example.com"
                        className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700">Topic</label>
                    <select
                      required
                      value={form.topic}
                      onChange={(e) => update("topic", e.target.value)}
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                    >
                      <option value="">Select a topic</option>
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder="Tell us how we can help…"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Send size={15} /> Send Message
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            {CONTACT_INFO.map((item) => (
              <div key={item.label} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <item.icon size={20} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{item.label}</p>
                  <p className="mt-0.5 font-semibold text-neutral-900">{item.value}</p>
                  <p className="text-xs text-neutral-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
