import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LyricsSection from "@/components/LyricsSection";
import FeaturesBento from "@/components/FeaturesBento";
import CustomizeSection from "@/components/CustomizeSection";
import OpenSourceSection from "@/components/OpenSourceSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <Hero />
        </div>
        <LyricsSection />
        <FeaturesBento />
        <CustomizeSection />
        <OpenSourceSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
