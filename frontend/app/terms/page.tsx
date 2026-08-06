import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By creating an account or accessing the Provenix platform, you agree to be bound by these Terms of Use. If you do not agree, you may not use the platform. We reserve the right to update these terms at any time; continued use after changes constitutes acceptance.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years old and legally able to enter binding contracts to use Provenix. By registering, you confirm that all information you provide is accurate, current, and complete. Accounts may not be transferred without our written consent.`,
  },
  {
    title: "3. Buyer Obligations",
    body: `Buyers agree to bid only when they intend to purchase. Placing a winning bid creates a legally binding obligation to complete the purchase at the agreed price. Buyers must maintain sufficient funds in their wallet or on-file payment method to cover bids placed. Identity verification (KYC) is required before participating in live auctions.`,
  },
  {
    title: "4. Seller Obligations",
    body: `Sellers must accurately represent every listing, including condition, provenance, and reserve price. Misleading or fraudulent listings will result in immediate account suspension and potential legal action. Sellers agree to honor accepted bids and deliver items within the timeframe specified at listing.`,
  },
  {
    title: "5. Auctions & Bidding",
    body: `All bids are final once submitted. The highest bidder at auction close is the winning buyer. Provenix reserves the right to cancel or re-run any auction where technical issues, fraud, or violation of these terms is detected. Reserve prices are kept confidential and an auction may close without a sale if the reserve is not met.`,
  },
  {
    title: "6. Escrow & Payments",
    body: `Winning bid funds are held in escrow by Provenix until the transaction is confirmed by both parties. Provenix charges a platform fee on completed transactions as described in our Fee Schedule. Refunds are issued only in cases of item non-delivery, material misrepresentation, or at Provenix's sole discretion.`,
  },
  {
    title: "7. Prohibited Conduct",
    body: `Users may not: engage in bid manipulation or shill bidding; list counterfeit, stolen, or prohibited items; attempt to circumvent platform fees by transacting off-platform; use automated bots or scripts; or harass other users or platform staff. Violations may result in permanent account termination and reporting to relevant authorities.`,
  },
  {
    title: "8. Intellectual Property",
    body: `All content on the Provenix platform — including logos, design, text, and software — is owned by Provenix or its licensors. You may not reproduce, distribute, or create derivative works without express written permission. User-uploaded content grants Provenix a non-exclusive, worldwide license to display and promote listings.`,
  },
  {
    title: "9. Privacy",
    body: `Your use of the platform is also governed by our Privacy Policy, which is incorporated into these Terms by reference. We collect, store, and process your data to operate the platform and comply with legal obligations. We do not sell personal data to third parties.`,
  },
  {
    title: "10. Limitation of Liability",
    body: `To the maximum extent permitted by law, Provenix is not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability for any claim shall not exceed the total fees paid by you to Provenix in the 12 months preceding the claim.`,
  },
  {
    title: "11. Dispute Resolution",
    body: `Any disputes arising from these Terms shall first be submitted to Provenix's support team for informal resolution. If unresolved within 30 days, disputes shall be resolved through binding arbitration in accordance with applicable commercial arbitration rules. Class action waiver applies to the fullest extent permitted by law.`,
  },
  {
    title: "12. Governing Law",
    body: `These Terms are governed by the laws of the jurisdiction in which Provenix is incorporated, without regard to conflict-of-law principles. Any legal proceedings shall be brought exclusively in the courts of that jurisdiction.`,
  },
  {
    title: "13. Contact",
    body: `For questions about these Terms, please contact us at legal@provenix.com or through the Contact page on our website. We aim to respond to all legal inquiries within 5 business days.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ aspectRatio: "1812 / 629" }}>
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
              Legal
            </span>
            <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-white md:text-5xl">
              Terms of Use
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-purple-100">
              Please read these terms carefully before using the Provenix platform. By signing up, you agree to be bound by them.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-4xl px-6 lg:px-8">
          <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            <strong>Last updated:</strong> {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.
            These terms apply to all users of the Provenix auction platform. If you have questions, please{" "}
            <Link href="/contact" className="font-semibold underline underline-offset-2 hover:text-amber-900">
              contact us
            </Link>
            .
          </div>

          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.title} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-neutral-600">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-neutral-500">
              By using Provenix you confirm you have read and agree to these Terms of Use.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white transition hover:scale-105"
              >
                Create an Account
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-neutral-200 px-8 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
