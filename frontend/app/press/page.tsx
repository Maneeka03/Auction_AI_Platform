import Image from "next/image";
import Link from "next/link";
import { Newspaper, ExternalLink } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const PRESS_RELEASES = [
  {
    date: "July 2026",
    tag: "Company",
    title: "Aucto Raises Series A to Expand Fine Asset Auctions Globally",
    excerpt:
      "The funding will be used to grow our engineering team, expand into new asset categories, and deepen our seller-verification technology.",
  },
  {
    date: "May 2026",
    tag: "Product",
    title: "Introducing 3D Asset Views — See Every Angle Before You Bid",
    excerpt:
      "Buyers can now interact with photorealistic 3D scans of listed items directly in the browser, reducing uncertainty and building buyer confidence.",
  },
  {
    date: "March 2026",
    tag: "Community",
    title: "Aucto Partners with Leading Gemological Institute for Jewellery Appraisal",
    excerpt:
      "Every fine jewellery listing is now reviewed by a certified gemologist before going live, ensuring reserve prices reflect real-world valuations.",
  },
  {
    date: "January 2026",
    tag: "Milestone",
    title: "10,000 Assets Listed — A Milestone for the Community",
    excerpt:
      "In just over a year of operation, Aucto has hosted more than 10,000 unique asset listings across fine art, antique watches, carpets, and jewellery.",
  },
];

const LOGOS = ["TechCrunch", "Forbes", "Reuters", "Bloomberg", "WWD"];

export default function PressPage() {
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
              Press
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Aucto in the News
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              For press enquiries contact{" "}
              <a href="mailto:press@aucto.com" className="underline underline-offset-2">
                press@aucto.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* As Seen In */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-neutral-400">As Seen In</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-10">
            {LOGOS.map((name) => (
              <span key={name} className="text-xl font-black tracking-tight text-neutral-300">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-bold text-neutral-900">Press Releases</h2>
        <div className="mt-8 space-y-6">
          {PRESS_RELEASES.map((item) => (
            <div key={item.title} className="flex gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Newspaper size={22} className="text-brand-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{item.tag}</span>
                  <span className="text-xs text-neutral-400">{item.date}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-neutral-900">{item.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{item.excerpt}</p>
                <button type="button" className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                  Read more <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Press kit CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Download Our Press Kit</h2>
          <p className="mt-3 text-neutral-500">Logos, brand guidelines, executive bios, and product screenshots — everything you need to write about us.</p>
          <button type="button" className="mt-6 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            Download Press Kit
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
