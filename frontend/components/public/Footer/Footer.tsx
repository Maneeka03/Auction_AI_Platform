"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { listPublicCategories } from "@/lib/api/categories";

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-7.5h2.5l.5-3H13.5V8.5c0-.9.25-1.5 1.5-1.5H16.5V4.3C16.2 4.26 15.2 4.17 14 4.17c-2.5 0-4.2 1.53-4.2 4.33V10.5H7v3h2.8V21h3.7z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 0 1-1.9.1c.5 1.6 2 2.8 3.8 2.9A8.2 8.2 0 0 1 2 18.6a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2 3.77-2 4.03 0 4.78 2.65 4.78 6.1V21H17.4v-5.4c0-1.29-.02-2.94-1.79-2.94-1.8 0-2.08 1.4-2.08 2.85V21H9z" />
    </svg>
  );
}

function PlusMark({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className={className}>
      <path
        d="M12 4v16M4 12h16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HexMark({ className }: { className?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2 21 7v10l-9 5-9-5V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const CONTACT = {
  phone1: "+1 (000) 000-0000",
  phone2: "+1 (000) 000-0001",
  email: "help@Provenix.com",
  address: "Democountry, AB",
};

const AUCTION_CATEGORIES = [
  "Agricultural Machinery",
  "Antique Watches",
  "Jewellery",
  "Residential"
];

const ABOUT_LINKS = [
  { label: "About Provenix", href: "/about" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Our Blog", href: "/blog" },
];

const HELP_LINKS = [
  { label: "Your Account", href: "/login" },
  { label: "Safe & Secure", href: "/safe-and-secure" },
  { label: "Shipping Information", href: "/shipping" },
  { label: "Contact Us", href: "/contact" },
  { label: "Help & FAQ", href: "/faq" },
];

const PAYMENT_BADGES = ["PayPal", "Visa", "Discover", "Mastercard"];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [categoryHrefs, setCategoryHrefs] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    void listPublicCategories()
      .then((categories) => {
        if (!active) return;
        const allCategories = categories.flatMap((category) => [category, ...category.children]);
        setCategoryHrefs(
          Object.fromEntries(
            AUCTION_CATEGORIES.flatMap((label) => {
              const category = allCategories.find(
                (item) => item.name.trim().toLowerCase() === label.toLowerCase(),
              );
              return category ? [[label, `/browse-properties?category=${category.id}`]] : [];
            }),
          ),
        );
      })
      .catch(() => {
        // Keep the unfiltered Browse Assets fallback if categories are unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <footer className="relative overflow-hidden pt-24 mt-8">
      <div
        className="absolute inset-x-0 bottom-0 top-32 overflow-hidden"
        style={{ clipPath: "polygon(0 22%, 100% 0%, 100% 100%, 0% 100%)" }}
      >
        <Image
          src="/images/footer/footer-bg.jpg"
          alt=""
          fill
          className="object-contain object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-700/20 via-brand-700/35 to-brand-900/55" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 opacity-70">
        <Image
          src="/images/footer/footer-top-shape.png"
          alt=""
          width={1920}
          height={659}
          className="h-auto w-full"
        />
      </div>

      <PlusMark className="pointer-events-none absolute left-[18%] top-10 text-pink-300" />
      <PlusMark className="pointer-events-none absolute left-[38%] top-16 text-neutral-300" />
      <HexMark className="pointer-events-none absolute left-[8%] top-52 text-pink-300" />

      <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 rounded-3xl bg-white p-8 shadow-2xl md:flex-row md:justify-between md:p-10">
          <Image
            src="/images/footer/newslater.png"
            alt=""
            width={280}
            height={212}
            className="h-auto w-56 shrink-0 md:w-64"
          />
          <div className="w-full text-center md:text-left">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-500">
              Subscribe to Provenix
            </span>
            <h2 className="mt-2 text-3xl font-bold text-neutral-900">
              To Get Exclusive Benefits
            </h2>
            <form
              onSubmit={handleSubscribe}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-full border border-neutral-200 px-6 py-4 text-sm text-neutral-900 outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-8 py-4 text-sm font-semibold text-white transition hover:scale-105"
              >
                Subscribe
              </button>
            </form>
            {submitted && (
              <p className="mt-3 text-sm font-medium text-brand-600">
                Thanks — you&apos;re on the list.
              </p>
            )}
          </div>
        </div>

          <div className="mt-16 flex flex-col gap-10 text-white md:flex-row md:justify-around md:items-start">
          <div>
            <h3 className="text-lg font-bold">Auction Categories</h3>
            <ul className="mt-5 space-y-3">
              {AUCTION_CATEGORIES.map((label) => (
                <li key={label}>
                  <Link href={categoryHrefs[label] ?? "/browse-properties"} className="text-purple-100 transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold">About Us</h3>
            <ul className="mt-5 space-y-3">
              {ABOUT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-purple-100 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold">We&apos;re Here to Help</h3>
            <ul className="mt-5 space-y-3">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-purple-100 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold">Follow Us</h3>
            <ul className="mt-5 space-y-3 text-purple-100">
              <li className="flex items-center gap-3"><Phone size={16} /> {CONTACT.phone1}</li>
              <li className="flex items-center gap-3"><Phone size={16} /> {CONTACT.phone2}</li>
              <li className="flex items-center gap-3"><Mail size={16} /> {CONTACT.email}</li>
              <li className="flex items-center gap-3"><MapPin size={16} /> {CONTACT.address}</li>
            </ul>
            <div className="mt-6 flex gap-3">
              <Link href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white hover:text-brand-700">
                <FacebookIcon />
              </Link>
              <Link href="#" aria-label="Twitter" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white hover:text-brand-700">
                <TwitterIcon />
              </Link>
              <Link href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white hover:text-brand-700">
                <InstagramIcon />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white hover:text-brand-700">
                <LinkedinIcon />
              </Link>
            </div>
          </div>
        </div>
        {/* bottom bar: wordmark · payment badges · copyright */}
        <div className="mt-16 flex flex-col items-center gap-6 border-t border-white/10 pb-10 pt-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              <span className="text-lg font-bold text-brand-700">P</span>
            </div>
            <span className="text-xl font-bold text-white">Provenix</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_BADGES.map((label) => (
              <span
                key={label}
                className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/80"
              >
                {label}
              </span>
            ))}
          </div>

          <p className="text-sm text-purple-200">
            © {new Date().getFullYear()} Provenix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
