import Image from "next/image";
import Link from "next/link";
import {

  ClipboardList,
  ShieldCheck,
  Lock,
  TrendingUp,
  Users,
  UserPlus,
  FileCheck,
  Gavel,
  Wallet,
} from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
 
const BENEFITS = [
  {
    icon: Users,
    title: "Reach Verified Buyers",
    description:
      "Every buyer on the platform completes identity verification (KYC) before they can bid.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description:
      "Track views, bidder interest, and auction performance on every listing you run.",
  },
  {
    icon: Lock,
    title: "Escrow-Protected Payouts",
    description:
      "Winning funds are held in escrow and released to you once the sale is confirmed.",
  },
  {
    icon: ClipboardList,
    title: "Full Listing Control",
    description:
      "Manage listings, reserve prices, and auction requests from your own seller dashboard.",
  },
];
 
const STEPS = [
  {
    icon: UserPlus,
    title: "Apply & Verify",
    description: "Create a seller account and complete identity verification.",
  },
  {
    icon: FileCheck,
    title: "Submit Your Listing",
    description: "Add your property details, photos, and reserve price.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed & Approved",
    description: "Our team reviews every listing before it goes live.",
  },
  {
    icon: Wallet,
    title: "Go Live & Get Paid",
    description:
      "Your auction runs, and proceeds are released to you via escrow once it closes.",
  },
];
 
export default function BecomeSellerPage() {
  return (
    
    <div className="min-h-screen bg-white">
      
      <Navbar />
      <section
        className="relative min-h-[420px] overflow-hidden sm:min-h-0"
        style={{ aspectRatio: "1812 / 629" }}
      >
        <Image
          src="/images/property-detail/hero-bg.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] items-center px-8 pt-16 text-center">
          <div className="mx-auto">
            <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
              For Sellers
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Sell With Confidence, Reach Real Buyers
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              List your properties, run live auctions, and get paid securely —
              all from one seller dashboard.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup?role=seller"
                className="rounded-xl bg-white px-8 py-4 font-semibold text-violet-700 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                Become a Seller
              </Link>
              <Link
                // href="/seller/dashboard"
                href="/login"
                className="rounded-xl border border-white px-8 py-4 font-semibold text-white transition duration-300 hover:bg-white hover:text-violet-700"
              >
                Already a Seller?
              </Link>
            </div>
          </div>
        </div>
      </section>
 
      {/* Benefits */}
      <section className="py-15">
        <div className="mx-auto w-full max-w-[1600px] px-8">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
              Why Sell Here
            </span>
            <h2 className="mt-2 text-4xl font-bold text-neutral-900">
              Built for Serious Sellers
            </h2>
          </div>
 
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-neutral-200 p-8 text-center transition-shadow hover:shadow-lg"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                    <Icon size={26} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* How it works for sellers */}
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto w-full max-w-[1600px] px-8">
          <div className="text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
              How It Works
            </span>
            <h2 className="mt-2 text-4xl font-bold text-neutral-900">
              From Listing to Payout
            </h2>
          </div>
 
          <div className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 bg-neutral-200 md:block" />
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg">
                    <Icon size={24} />
                  </div>
                  <span className="mt-4 text-xs font-bold uppercase tracking-wide text-brand-500">
                    Step {index + 1}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-neutral-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-[1600px] px-8">
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl px-10 py-24 text-center md:flex-row md:text-left">
            <Image
              src="/images/seller/call-bg.png"
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-700/20 via-transparent to-transparent" />
 
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white">
                Ready to list your first property?
              </h2>
              <p className="mt-2 text-purple-100">
                Sign up as a seller and get verified in minutes.
              </p>
            </div>
            <Link
              // href="/signup?role=seller"
              href="/signup"
              className="relative z-10 flex shrink-0 items-center gap-2 rounded-full bg-white px-8 py-4 font-semibold text-violet-700 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Gavel size={18} /> Become a Seller
            </Link>
          </div>
        </div>
      </section>
 
      <Footer />
    </div>
  );
}