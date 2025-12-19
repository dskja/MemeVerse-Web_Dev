import { Smile, TrendingUp, Code, Heart, Gamepad2, Coffee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    name: "Relatable",
    description: "Everyday moments we all understand",
    icon: Smile,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    name: "Trending",
    description: "What's hot on the internet right now",
    icon: TrendingUp,
    gradient: "from-orange-500 to-amber-500",
  },
  {
    name: "Tech & Dev",
    description: "For the coding culture enthusiasts",
    icon: Code,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Wholesome",
    description: "Feel-good content for your soul",
    icon: Heart,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Gaming",
    description: "Level up your gaming humor",
    icon: Gamepad2,
    gradient: "from-purple-500 to-violet-500",
  },
  {
    name: "Daily Life",
    description: "The struggle is real",
    icon: Coffee,
    gradient: "from-amber-500 to-yellow-500",
  },
];

export function CategoriesSection() {
  return (
    <section id="categories" className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-bold text-3xl md:text-5xl mb-4">
            Meme <span className="text-primary">Categories</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-serif">
            From tech humor to wholesome content, we've got every flavor of meme 
            to match your mood.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Card
              key={category.name}
              className="group cursor-pointer overflow-visible hover-elevate active-elevate-2"
              data-testid={`card-category-${index}`}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}
                >
                  <category.icon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
