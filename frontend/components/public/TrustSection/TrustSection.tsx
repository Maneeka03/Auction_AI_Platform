import { ShieldCheck, Lock, ClipboardCheck } from "lucide-react";

// Copy here is scoped to what the platform actually does today. A formal
// gemologist/legal 2-of-3 approval quorum is planned but not yet built —
// what's real right now is that every auction is reviewed and approved by
// the admin team before it goes live, so that's what's claimed here.
const FEATURES = [
  {
    icon: ShieldCheck,
    title: "KYC-Verified Members",
    description: "Every buyer and seller completes identity verification before participating.",
  },
  {
    icon: Lock,
    title: "Escrow-Protected Payments",
    description: "Winning bids are held in escrow and only released once the deal is confirmed.",
  },
  {
    icon: ClipboardCheck,
    title: "Reviewed Before Listing",
    description: "Every auction is reviewed and approved by our team before it goes live.",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-[1600px] px-8">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
            Built On Trust
          </span>
          <h2 className="mt-2 text-4xl font-bold text-neutral-900">Bid With Confidence</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-neutral-200 p-8 text-center transition-shadow hover:shadow-lg"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                  <Icon size={26} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-neutral-500">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}