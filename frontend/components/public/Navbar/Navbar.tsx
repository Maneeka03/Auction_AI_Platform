"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/session-context";

const STAFF_ROLES = ["super_admin", "auction_manager", "marketing", "legal", "finance", "gemologist", "executive"];

function useBrowseHref() {
    const { session } = useAuth();
    if (!session) return "/browse-properties";
    if (session.roles.some((r) => STAFF_ROLES.includes(r))) return "/admin/properties";
    if (session.roles.includes("seller")) return "/seller/dashboard";
    return "/browse-properties";
}

export default function Navbar({ solid = false }: { solid?: boolean }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const browseHref = useBrowseHref();

    useEffect(() => {
        const handleScroll = () => {setIsScrolled(window.scrollY > 40);};
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Pages without a dark hero behind the bar (e.g. property pages) force the opaque, dark-text
    // style so the logo and links stay readable on a white background.
    const opaque = solid || isScrolled;

    return (
        <header className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${ opaque ? "bg-white/95 shadow-lg backdrop-blur-md": "bg-transparent"}`}>
            <div className="mx-auto flex h-20 sm:h-24 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                        <span className="text-xl font-bold text-violet-700">P</span>
                    </div>
                    <span className={`text-3xl font-bold transition ${ opaque ? "text-violet-700" : "text-white"}`}>
                        Provenix
                    </span> 
                </Link>

                <nav className="hidden items-center gap-10 lg:flex">
                    <Link href="/" className={`font-medium transition ${ opaque? "text-gray-700 hover:text-violet-600": "text-white hover:text-white/80"}`}>
                        Home
                    </Link>
                    <Link href={browseHref} className={`font-medium transition ${opaque? "text-gray-700 hover:text-violet-600": "text-white hover:text-white/80"}`}>
                        Browse Assets
                    </Link>
                    <Link href="/live-auctions" className={`font-medium transition ${ opaque? "text-gray-700 hover:text-violet-600": "text-white hover:text-white/80"}`}>
                        Live Auctions
                    </Link>
                    <Link href="/seller" className={`font-medium transition ${opaque? "text-gray-700 hover:text-violet-600": "text-white hover:text-white/80"}`}>
                        Become Seller
                    </Link>
                    <Link href="/about" className={`font-medium transition ${opaque? "text-gray-700 hover:text-violet-600": "text-white hover:text-white/80"}`}>
                        About
                    </Link>
                </nav>

                <div className="hidden items-center gap-5 lg:flex">
                    <Link href="/login" className={`font-semibold transition ${ opaque? "text-gray-700 hover:text-violet-600": "text-white hover:text-white/80"}`}>
                        Login
                    </Link>
                    <Link href="/signup"className="rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-7 py-3 font-semibold text-white transition hover:scale-105">
                        Sign Up
                    </Link>
                </div>

                <button onClick={() => setMobileMenu(!mobileMenu)} className={`lg:hidden ${opaque ? "text-gray-700" : "text-white"}`}>
                    {mobileMenu ? <X size={30} /> : <Menu size={30} />}
                </button>
            </div>

            {mobileMenu && (
                <div className="lg:hidden bg-white rounded-b-3xl shadow-2xl">
                    <div className="flex flex-col px-6 py-6">
                    <Link href="/" className="py-3 text-lg font-medium border-b border-gray-100">
                        Home
                    </Link>
                    <Link href={browseHref} className="py-3 text-lg font-medium border-b border-gray-100">
                        Browse Assets
                    </Link>
                    <Link href="/live-auctions"className="py-3 text-lg font-medium border-b border-gray-100">
                        Live Auctions
                    </Link>
                    <Link href="/seller"className="py-3 text-lg font-medium border-b border-gray-100">
                        Become Seller
                    </Link>
                    <Link href="/about" className="py-3 text-lg font-medium">
                        About
                    </Link>
                    <div className="mt-6 flex flex-col gap-4">
                        <Link href="/login" className="rounded-full border border-violet-600 py-3 text-center font-semibold text-violet-600">
                            Login
                        </Link>
                        <Link href="/signup" className="rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 text-center font-semibold text-white">
                            Sign Up
                        </Link>
                    </div>
                </div>
            </div>
        )}</header>
    );
}