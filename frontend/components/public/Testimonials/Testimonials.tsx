import { Star } from "lucide-react";

// TODO: placeholder quotes — not real clients. Swap for actual reviews once you have them.
const TESTIMONIALS = [
  {
    name: "Rachel M.",
    role: "Buyer",
    quote:
      "The bidding process was smooth and I always knew exactly where my funds stood. Closed my first purchase in under a week.",
  },
  {
    name: "David K.",
    role: "Buyer",
    quote:
      "Verification took a few minutes and after that I could bid on live auctions right from my phone. Straightforward experience.",
  },
  {
    name: "Priya S.",
    role: "Buyer",
    quote:
      "Escrow protection made me comfortable bidding on a higher-value item for the first time. Everything closed exactly as expected.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-neutral-50 py-20">
      <div className="mx-auto w-full max-w-[1600px] px-8">
        <div className="text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
            Testimonials
          </span>
          <h2 className="mt-2 text-4xl font-bold text-neutral-900">What Buyers Are Saying</h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 border-t border-neutral-100 pt-4">
                <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                <p className="text-xs text-neutral-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}