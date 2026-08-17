import Image from "next/image";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const OPENINGS = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote / Hybrid",
    type: "Full-Time",
    description: "Build and scale core auction infrastructure. Experience with Next.js, Go, and distributed systems preferred.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-Time",
    description: "Shape the experience for buyers and sellers. You'll own end-to-end design from research to shipping.",
  },
  {
    title: "Auction Specialist",
    department: "Operations",
    location: "On-site",
    type: "Full-Time",
    description: "Expert knowledge of fine art, jewellery, or watches. You'll review listings and advise sellers on reserve pricing.",
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote / Hybrid",
    type: "Full-Time",
    description: "Drive buyer and seller acquisition through performance, content, and community channels.",
  },
  {
    title: "Customer Success Associate",
    department: "Support",
    location: "Remote",
    type: "Part-Time",
    description: "Be the first point of contact for our community. Help buyers and sellers navigate the platform with ease.",
  },
];

const PERKS = [
  { emoji: "🌍", title: "Remote-Friendly", desc: "Work from wherever you do your best thinking." },
  { emoji: "📈", title: "Equity", desc: "Every team member is a stakeholder in what we build." },
  { emoji: "🏥", title: "Health Coverage", desc: "Comprehensive medical, dental, and vision." },
  { emoji: "📚", title: "Learning Budget", desc: "$1,500/year for courses, books, and conferences." },
  { emoji: "🎉", title: "Team Retreats", desc: "Annual off-site to connect in person." },
  { emoji: "⏰", title: "Flexible Hours", desc: "Results matter more than when you log in." },
];

export default function CareersPage() {
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
              Careers
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Join the Team Building the Future of Auctions
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              We&apos;re a small team with big ambitions. Help us make asset trading more open, transparent, and trusted.
            </p>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-neutral-900">Why Work With Us</h2>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <span className="text-3xl">{p.emoji}</span>
              <h3 className="mt-3 font-semibold text-neutral-900">{p.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Job Openings */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold text-neutral-900">Open Positions</h2>
          <p className="mt-2 text-neutral-500">All roles are open to applicants worldwide unless otherwise noted.</p>
          <div className="mt-8 space-y-4">
            {OPENINGS.map((job) => (
              <div key={job.title} className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 transition hover:border-brand-300 hover:bg-brand-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-semibold text-brand-700">{job.department}</span>
                    <span className="flex items-center gap-1 text-xs text-neutral-400"><MapPin size={12} /> {job.location}</span>
                    <span className="flex items-center gap-1 text-xs text-neutral-400"><Clock size={12} /> {job.type}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-neutral-900">{job.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{job.description}</p>
                </div>
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Apply <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-neutral-400">
            Don&apos;t see the right role?{" "}
            <a href="mailto:help@Provenix.com" className="font-semibold text-brand-600 hover:underline">
              Send us your CV anyway →
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
