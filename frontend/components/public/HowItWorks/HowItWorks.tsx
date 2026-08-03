import Image from "next/image";
import { UserPlus, Gavel, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Register & Verify",
    description: "Create an account and complete identity verification (KYC) before you can bid.",
  },
  {
    icon: Gavel,
    title: "Browse & Bid",
    description: "Explore live and upcoming auctions, then place bids in real time from any device.",
  },
  {
    icon: ShieldCheck,
    title: "Win & Close in Escrow",
    description: "Winning funds are held in escrow until the transaction is confirmed and released.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-20">
      <Image
        src="/images/how-it-works/real-bg.png"
        alt=""
        fill
        className="object-cover object-center"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-8">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
            How It Works
          </span>
          <h2 className="mt-2 text-4xl font-bold text-neutral-900">Bidding Made Simple</h2>
          <p className="mt-3 text-neutral-500">Three steps from browsing to owning.</p>
        </div>

        <div className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-white/70 md:block" />

          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg">
                  <Icon size={26} />
                </div>
                <span className="mt-4 text-xs font-bold uppercase tracking-wide text-brand-500">
                  Step {index + 1}
                </span>
                <h3 className="mt-1 text-lg font-semibold text-neutral-900">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm text-neutral-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}