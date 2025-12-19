import { TrendingUp, Users, Zap, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { icon: Users, label: "Followers", value: "50K+", description: "Growing daily" },
  { icon: TrendingUp, label: "Monthly Views", value: "2M+", description: "And counting" },
  { icon: Zap, label: "Daily Posts", value: "5-10", description: "Fresh content" },
  { icon: Target, label: "Engagement Rate", value: "12%", description: "Above average" },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="font-bold text-3xl md:text-5xl mb-6">
              About <span className="text-primary">MemeVerse</span>
            </h2>
            <div className="space-y-4 text-muted-foreground font-serif text-base md:text-lg">
              <p>
                Welcome to MemeVerse, your ultimate destination for the freshest, 
                funniest, and most relatable memes on the internet. We curate and 
                create content that speaks to the everyday experiences of our generation.
              </p>
              <p>
                Founded by meme enthusiasts for meme enthusiasts, our mission is simple: 
                to bring a smile to your face, one meme at a time. Whether you're having 
                a rough day or just need a quick laugh, MemeVerse has got you covered.
              </p>
              <p>
                Join our growing community of over 50,000 followers and become part 
                of the internet culture revolution. Follow us @MemeVerseDC for daily 
                doses of humor, trending content, and exclusive memes you won't find 
                anywhere else.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <Card
                key={stat.label}
                className="text-center p-6 hover-elevate"
                data-testid={`card-stat-${index}`}
              >
                <CardContent className="p-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="font-medium text-foreground">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
