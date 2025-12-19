import { Instagram, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import logoImage from "@assets/IMG_0856_1766103768140.gif";

export function HeroSection() {
  const { t } = useLanguage();

  const scrollToMemes = () => {
    const element = document.querySelector("#memes");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/30" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 md:w-48 md:h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-40 h-40 md:w-64 md:h-64 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 md:w-32 md:h-32 bg-chart-2/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <img
              src={logoImage}
              alt="MemeVerse Logo"
              className="relative h-28 w-28 md:h-40 md:w-40 rounded-full object-cover border-4 border-background shadow-2xl"
              data-testid="img-hero-logo"
            />
          </div>
        </div>

        <h1 className="font-bold text-4xl sm:text-5xl md:text-7xl mb-4 tracking-tight">
          {t.home.heroTitle.split("MemeVerse")[0]}
          <span className="bg-gradient-to-r from-primary via-chart-2 to-primary bg-clip-text text-transparent">
            MemeVerse
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-muted-foreground mb-3 font-medium">
          @MemeVerseDC
        </p>

        <p className="text-base md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-serif">
          {t.home.heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="gap-2 px-8 rounded-full text-base"
            onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
            data-testid="button-hero-follow"
          >
            <Instagram className="h-5 w-5" />
            {t.nav.followOnInstagram}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 px-8 rounded-full text-base"
            onClick={scrollToMemes}
            data-testid="button-hero-explore"
          >
            {t.home.exploreMemes}
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-16 flex justify-center gap-8 md:gap-16 text-center">
          <div data-testid="stat-followers">
            <p className="text-3xl md:text-4xl font-bold text-foreground">50K+</p>
            <p className="text-sm md:text-base text-muted-foreground">{t.profile.followers}</p>
          </div>
          <div data-testid="stat-posts">
            <p className="text-3xl md:text-4xl font-bold text-foreground">1.2K</p>
            <p className="text-sm md:text-base text-muted-foreground">{t.profile.memes}</p>
          </div>
          <div data-testid="stat-engagement">
            <p className="text-3xl md:text-4xl font-bold text-foreground">98%</p>
            <p className="text-sm md:text-base text-muted-foreground">{t.home.engagement}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
      </div>
    </section>
  );
}
