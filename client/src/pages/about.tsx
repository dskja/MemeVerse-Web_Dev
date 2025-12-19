import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Zap, 
  Target, 
  Heart, 
  Share2, 
  Award,
  Instagram,
  Sparkles,
  Globe,
  Clock,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import logoImage from "@assets/IMG_0856_1766103768140.gif";

export default function AboutPage() {
  const { t } = useLanguage();
  
  const stats = [
    { icon: Users, label: t.about.stats.followers, value: "50K+", description: t.about.stats.growingDaily, color: "text-blue-500", gradient: "from-blue-500/20 to-blue-500/5" },
    { icon: TrendingUp, label: t.about.stats.monthlyViews, value: "2M+", description: t.about.stats.andCounting, color: "text-green-500", gradient: "from-green-500/20 to-green-500/5" },
    { icon: Zap, label: t.about.stats.dailyPosts, value: "5-10", description: t.about.stats.freshContent, color: "text-yellow-500", gradient: "from-yellow-500/20 to-yellow-500/5" },
    { icon: Target, label: t.about.stats.engagementRate, value: "12%", description: t.about.stats.aboveAverage, color: "text-primary", gradient: "from-primary/20 to-primary/5" },
  ];

  const features = [
    { icon: Heart, title: t.about.features.communityDriven, description: t.about.features.communityDrivenDesc, color: "text-red-500", bg: "bg-red-500/10" },
    { icon: Share2, title: t.about.features.viralContent, description: t.about.features.viralContentDesc, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Award, title: t.about.features.weeklyContests, description: t.about.features.weeklyContestsDesc, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { icon: Sparkles, title: t.about.features.freshDaily, description: t.about.features.freshDailyDesc, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Globe, title: t.about.features.multiLanguage, description: t.about.features.multiLanguageDesc, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Clock, title: t.about.features.alwaysUpdated, description: t.about.features.alwaysUpdatedDesc, color: "text-primary", bg: "bg-primary/10" },
  ];

  const highlights = [
    t.about.features.communityDrivenDesc,
    t.about.features.weeklyContestsDesc,
    t.about.features.freshDailyDesc,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <section className="relative py-24 md:py-40 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="mb-8">
              <div className="inline-block p-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                <img
                  src={logoImage}
                  alt="MemeVerse Logo"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-background"
                />
              </div>
            </div>
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              @MemeVerseDC
            </Badge>
            <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl mb-6">
              {t.home.aboutTitle.split(" ")[0]}{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                MemeVerse
              </span>
              ?
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto font-serif leading-relaxed mb-8">
              {t.home.aboutDescription}
            </p>
            <Button 
              size="lg" 
              className="gap-2 text-lg px-8"
              onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
              data-testid="button-hero-instagram"
            >
              <Instagram className="h-5 w-5" />
              {t.nav.follow} @MemeVerseDC
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/50 to-transparent" />
          <div className="max-w-7xl mx-auto relative">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card
                  key={stat.label}
                  className="text-center p-6 hover-elevate border-2 border-transparent hover:border-primary/20 transition-all duration-300 overflow-visible"
                  data-testid={`card-about-stat-${index}`}
                >
                  <CardContent className="p-0">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 transform transition-transform group-hover:scale-110`}>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <p className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{stat.value}</p>
                    <p className="font-semibold text-foreground mb-1">{stat.label}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <Badge variant="outline" className="mb-4">
                  <Heart className="h-3 w-3 mr-1 text-red-500" />
                  {t.about.ourStory}
                </Badge>
                <h2 className="font-bold text-3xl md:text-4xl mb-6">{t.about.ourStory}</h2>
                <div className="space-y-4 text-muted-foreground font-serif text-base md:text-lg leading-relaxed">
                  <p>{t.about.storyPara1}</p>
                  <p>{t.about.storyPara2}</p>
                  <p className="font-semibold text-foreground">{t.about.storyPara3}</p>
                </div>
                
                <div className="mt-8 space-y-3">
                  {highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent rounded-3xl blur-2xl" />
                <Card className="relative p-8 text-center bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/10">
                  <CardContent className="p-0">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur-xl" />
                      <div className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl">
                        <Instagram className="h-14 w-14 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-2xl md:text-3xl mb-2">@MemeVerseDC</h3>
                    <p className="text-muted-foreground mb-6">{t.about.followUs}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-2xl font-bold text-primary">50K+</p>
                        <p className="text-xs text-muted-foreground">{t.about.stats.followers}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50">
                        <p className="text-2xl font-bold text-primary">2M+</p>
                        <p className="text-xs text-muted-foreground">{t.about.stats.monthlyViews}</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full gap-2"
                      onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
                      data-testid="button-about-instagram"
                    >
                      <Instagram className="h-5 w-5" />
                      {t.nav.follow}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                {t.about.featuresLabel}
              </Badge>
              <h2 className="font-bold text-3xl md:text-4xl mb-4">
                {t.about.whyMemeverse}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.home.aboutDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={feature.title} className="p-6 hover-elevate group overflow-visible" data-testid={`card-feature-${index}`}>
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}>
                        <feature.icon className={`h-7 w-7 ${feature.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block p-1 rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 mb-6">
              <img
                src={logoImage}
                alt="MemeVerse Logo"
                className="w-16 h-16 rounded-full object-cover border-2 border-background"
              />
            </div>
            <h2 className="font-bold text-2xl md:text-3xl mb-4">
              {t.about.joinCommunity}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {t.about.storyPara2}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
              >
                <Instagram className="h-5 w-5" />
                {t.nav.follow} @MemeVerseDC
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => window.location.href = "/memes"}
              >
                <Sparkles className="h-5 w-5" />
                {t.nav.memes}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
