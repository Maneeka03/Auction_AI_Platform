import Navbar from "@/components/public/Navbar/Navbar";
import Hero from "@/components/public/Hero/Hero";
import Categories from "@/components/public/Categories/Categories";
import FeaturedAssets from "@/components/public/FeaturedAssets/FeaturedAssets";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Categories />
      <FeaturedAssets />
    </>
  );
}