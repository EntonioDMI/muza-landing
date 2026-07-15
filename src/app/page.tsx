import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LyricsSection from "@/components/LyricsSection";
import CityScene from "@/components/CityScene";
import FeaturesBento from "@/components/FeaturesBento";
import CustomizeSection from "@/components/CustomizeSection";
import OpenSourceSection from "@/components/OpenSourceSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import { parseLandingRelease } from "@/lib/release";

export default function Home() {
  const release = parseLandingRelease({
    NEXT_PUBLIC_MUZA_RELEASE_TAG: process.env.NEXT_PUBLIC_MUZA_RELEASE_TAG,
    NEXT_PUBLIC_MUZA_RELEASE_URL: process.env.NEXT_PUBLIC_MUZA_RELEASE_URL,
    NEXT_PUBLIC_MUZA_RELEASE_SHA256: process.env.NEXT_PUBLIC_MUZA_RELEASE_SHA256,
    NEXT_PUBLIC_MUZA_RELEASE_SIZE: process.env.NEXT_PUBLIC_MUZA_RELEASE_SIZE,
  });

  return (
    <>
      <Header release={release} />
      <main id="main">
        <div className="container">
          <Hero release={release} />
        </div>
        <LyricsSection />
        <CityScene />
        <FeaturesBento />
        <CustomizeSection />
        <OpenSourceSection />
        <FinalCta release={release} />
      </main>
      <Footer release={release} />
    </>
  );
}
