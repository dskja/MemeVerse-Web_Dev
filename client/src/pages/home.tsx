import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { MemesSection } from "@/components/memes-section";
import { AboutSection } from "@/components/about-section";
import { CreatorOfMonth } from "@/components/creator-of-month";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <CreatorOfMonth />
        <MemesSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
