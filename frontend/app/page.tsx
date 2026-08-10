// import Navbar from "@/components/public/Navbar/Navbar";
// import Hero from "@/components/public/Hero/Hero";
// import Categories from "@/components/public/Categories/Categories";
// import HowItWorks from "@/components/public/HowItWorks/HowItWorks";
// import FeaturedAssets from "@/components/public/FeaturedAssets/FeaturedAssets";
// import UpcomingAuctions from "@/components/public/UpcomingAuctions/UpcomingAuctions";
// import Testimonials from "@/components/public/Testimonials/Testimonials";
// import Footer from "@/components/public/Footer/Footer";

// export default function Home() {
//   return (
//     <>
//       <Navbar />
//       <Hero />
//       <Categories />
//       <FeaturedAssets />
//       <UpcomingAuctions />
//       <HowItWorks />
//       {/* <TrustSection />
//       <Testimonials /> */}
//       <Testimonials />
//       <Footer />
//     </>
//   );
// }
"use client";

import { useEffect } from "react";
import Navbar from "@/components/public/Navbar/Navbar";
import Hero from "@/components/public/Hero/Hero";
import Categories from "@/components/public/Categories/Categories";
import HowItWorks from "@/components/public/HowItWorks/HowItWorks";
import FeaturedAssets from "@/components/public/FeaturedAssets/FeaturedAssets";
import UpcomingAuctions from "@/components/public/UpcomingAuctions/UpcomingAuctions";
import Testimonials from "@/components/public/Testimonials/Testimonials";
import Footer from "@/components/public/Footer/Footer";

export default function Home() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Remember previous state
    const hadDark = html.classList.contains("dark");

    // Force light mode on landing page
    html.classList.remove("dark");
    html.style.colorScheme = "light";
    body.style.backgroundColor = "#ffffff";
    body.style.color = "#111827";

    // Restore when leaving the page
    return () => {
      if (hadDark) {
        html.classList.add("dark");
        html.style.colorScheme = "dark";
      } else {
        html.style.colorScheme = "light";
      }
      body.style.backgroundColor = "";
      body.style.color = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedAssets />
      <UpcomingAuctions />
      <HowItWorks />
      <Testimonials />
      <Footer />
    </div>
  );
}