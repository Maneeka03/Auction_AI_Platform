import Navbar from "@/components/public/Navbar/Navbar";
import Hero from "@/components/public/Hero/Hero";
import Categories from "@/components/public/Categories/Categories";
import HowItWorks from "@/components/public/HowItWorks/HowItWorks";
import FeaturedAssets from "@/components/public/FeaturedAssets/FeaturedAssets";
import UpcomingAuctions from "@/components/public/UpcomingAuctions/UpcomingAuctions";
import TrustSection from "@/components/public/TrustSection/TrustSection";
import Testimonials from "@/components/public/Testimonials/Testimonials";
import Footer from "@/components/public/Footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedAssets />
      <UpcomingAuctions />
      <HowItWorks />
      {/* <TrustSection />
      <Testimonials /> */}
      <Footer />
    </>
  );
}