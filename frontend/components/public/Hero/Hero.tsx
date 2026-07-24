import Image from "next/image";
import Link from "next/link";

export default function Hero() {
    return (
    <section className="relative overflow-hidden bg-[#5B2BE0]">
        <Image src="/images/hero/banner-bg-4.png" alt="Hero Background" fill priority className="object-cover object-center"/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#4B22D1]/80 via-[#5B2BE0]/60 to-transparent" />
        <div className="relative z-30 mx-auto flex min-h-screen max-w-[1450px] items-center justify-between px-8 pt-28">
            <div className="w-full lg:w-[45%]">
                <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
                    AI Powered Digital Auction Platform
                </span>
                <h1 className="mt-8 text-5xl font-extrabold leading-[1.15] tracking-tight text-white lg:text-6xl">
                    Buy, Sell & Bid on <br /> Premium Assets
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-8 text-purple-100">
                    Discover verified assets, participate in live auctions,
                    and experience a secure marketplace built for buyers,
                    sellers and collectors.
                </p>
                <div className="mt-10 flex flex-wrap gap-5">
                    <Link href="/assets" className="rounded-xl bg-white px-8 py-4 font-semibold text-violet-700 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                        Browse Assets
                    </Link>
                    <Link href="/live-auctions" className="rounded-xl border border-white px-8 py-4 font-semibold text-white transition duration-300 hover:bg-white hover:text-violet-700">
                        Explore Auctions
                    </Link>
                </div>
                <div className="relative z-30 mt-16 flex gap-12 pb-40">
                    <div>
                        <h2 className="text-4xl font-bold text-white">15K+</h2>
                        <p className="mt-1 text-purple-200">Assets Listed</p>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-white">500+</h2>
                        <p className="mt-1 text-purple-200">Live Auctions</p>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-white">99%</h2>
                        <p className="mt-1 text-purple-200">Secure Deals</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="absolute right-0 bottom-10 z-20 hidden lg:block">
            <Image src="/images/hero/banner-5.png"  alt="Auction Illustration" width={900} height={900} priority className="w-[800px] max-w-none"/>
        </div>
        <div className="absolute bottom-0 left-0 z-10 w-full">
            <Image src="/images/hero/banner-shape-4.png" alt="Wave Shape" width={2000} height={657} priority className="w-full h-auto object-cover"/>
        </div>
    </section>
  );
}