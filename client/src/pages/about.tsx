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
  Star
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export default function AboutPage() {
  const { t } = useLanguage();
  
  const stats = [
    { icon: Users, label: t.about.stats.followers, value: "50K+", description: t.about.stats.growingDaily, color: "text-blue-500" },
    { icon: TrendingUp, label: t.about.stats.monthlyViews, value: "2M+", description: t.about.stats.andCounting, color: "text-green-500" },
    { icon: Zap, label: t.about.stats.dailyPosts, value: "5-10", description: t.about.stats.freshContent, color: "text-yellow-500" },
    { icon: Target, label: t.about.stats.engagementRate, value: "12%", description: t.about.stats.aboveAverage, color: "text-primary" },
  ];

  const features = [
    { icon: Heart, title: t.about.features.communityDriven, description: t.about.features.communityDrivenDesc },
    { icon: Share2, title: t.about.features.viralContent, description: t.about.features.viralContentDesc },
    { icon: Award, title: t.about.features.weeklyContests, description: t.about.features.weeklyContestsDesc },
    { icon: Sparkles, title: t.about.features.freshDaily, description: t.about.features.freshDailyDesc },
    { icon: Globe, title: t.about.features.multiLanguage, description: t.about.features.multiLanguageDesc },
    { icon: Clock, title: t.about.features.alwaysUpdated, description: t.about.features.alwaysUpdatedDesc },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <section className="relative py-20 md:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-transparent" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              {t.nav.about}
            </Badge>
            <h1 className="font-bold text-4xl md:text-6xl lg:text-7xl mb-6">
              {t.home.aboutTitle.split(" ")[0]}{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                MemeVerse
              </span>
              ?
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto font-serif leading-relaxed">
              {t.home.aboutDescription}
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card
                  key={stat.label}
                  className="text-center p-6 hover-elevate border-2 border-transparent hover:border-primary/20 transition-all duration-300"
                  data-testid={`card-about-stat-${index}`}
                >
                  <CardContent className="p-0">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4`}>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <p className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{stat.value}</p>
                    <p className="font-semibold text-foreground mb-1">{stat.label}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-bold text-3xl md:text-4xl mb-4">
                {t.about.whyMemeverse}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.home.aboutDescription}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={feature.title} className="p-6 hover-elevate group" data-testid={`card-feature-${index}`}>
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-bold text-3xl md:text-4xl mb-6">{t.about.ourStory}</h2>
                <div className="space-y-4 text-muted-foreground font-serif text-base md:text-lg leading-relaxed">
                  <p>{t.about.storyPara1}</p>
                  <p>{t.about.storyPara2}</p>
                  <p>{t.about.storyPara3}</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
                <Card className="relative p-8 text-center">
                  <CardContent className="p-0">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Instagram className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="font-bold text-2xl mb-2">@MemeVerseDC</h3>
                    <p className="text-muted-foreground mb-6">{t.about.followUs}</p>
                    <Button 
                      size="lg" 
                      className="gap-2"
                      onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
                      data-testid="button-about-instagram"
                    >
                      <Instagram className="h-5 w-5" />
                      {t.nav.follow} @MemeVerseDC
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
