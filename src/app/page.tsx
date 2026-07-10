import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LyricsSection from "@/components/LyricsSection";
import FeaturesBento from "@/components/FeaturesBento";
import CustomizeSection from "@/components/CustomizeSection";

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
      </main>
    </>
  );
}
