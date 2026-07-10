import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LyricsSection from "@/components/LyricsSection";
import FeaturesBento from "@/components/FeaturesBento";

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
      </main>
    </>
  );
}
