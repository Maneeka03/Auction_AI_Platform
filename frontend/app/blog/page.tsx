import Image from "next/image";
import Link from "next/link";
import { Clock, Tag } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const POSTS = [
  {
    tag: "Buying Guide",
    date: "Aug 2026",
    readTime: "6 min read",
    title: "How to Spot Authentic Fine Jewellery at Auction",
    excerpt:
      "From hallmarks to gem certifications — a practical checklist every jewellery buyer should run through before placing a bid.",
    color: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    tag: "Market Insight",
    date: "Jul 2026",
    readTime: "4 min read",
    title: "Antique Watch Prices Are Climbing — Here's Why",
    excerpt:
      "Demand for vintage mechanical watches has surged 40% year-on-year. We break down the categories driving growth.",
    color: "bg-amber-50 text-amber-700",
  },
  {
    tag: "Seller Tips",
    date: "Jun 2026",
    readTime: "5 min read",
    title: "Setting the Right Reserve Price: A Seller's Guide",
    excerpt:
      "Price too high and your listing stalls. Price too low and you leave money on the table. Our appraisal team shares the formula.",
    color: "bg-brand-50 text-brand-700",
  },
  {
    tag: "Platform News",
    date: "Jun 2026",
    readTime: "3 min read",
    title: "New: 3D Model Viewer Now Available for All Listings",
    excerpt:
      "Sellers can now upload .glb files so buyers can interact with photorealistic 3D models before bidding — no VR headset required.",
    color: "bg-green-50 text-green-700",
  },
  {
    tag: "Buying Guide",
    date: "May 2026",
    readTime: "7 min read",
    title: "Carpets & Textiles at Auction: What First-Time Buyers Need to Know",
    excerpt:
      "Provenance, pile height, knot count — we explain the key quality indicators you should check before bidding on any carpet.",
    color: "bg-rose-50 text-rose-700",
  },
  {
    tag: "Market Insight",
    date: "Apr 2026",
    readTime: "5 min read",
    title: "Fine Art as an Investment: Trends From This Quarter",
    excerpt:
      "Contemporary works are outpacing traditional categories. Our data team analysed 3,000 auction results to find the clearest signals.",
    color: "bg-violet-50 text-violet-700",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />
    <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
        Back to home
      </Link>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
        <Image src="/images/property-detail/hero-bg.png" alt="" fill className="object-contain object-top" priority />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
              Our Blog
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Insights, Guides & Market News
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Expert articles to help you buy smarter, sell better, and stay ahead of the market.
            </p>
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <article
              key={post.title}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-40 bg-gradient-to-br from-neutral-100 to-neutral-200" />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${post.color}`}>
                    <span className="flex items-center gap-1"><Tag size={10} /> {post.tag}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock size={11} /> {post.readTime}
                  </span>
                  <span className="text-xs text-neutral-400">{post.date}</span>
                </div>
                <h2 className="mt-3 text-base font-bold leading-snug text-neutral-900 group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">{post.excerpt}</p>
                <span className="mt-4 text-sm font-semibold text-brand-600 group-hover:underline">Read article →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
