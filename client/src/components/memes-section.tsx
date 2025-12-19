import { useState } from "react";
import { Heart, Share2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Meme } from "@shared/schema";

const sampleMemes: Meme[] = [
  { id: "1", title: "When Monday hits different", imageUrl: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&h=400&fit=crop", category: "Relatable", likes: 15420, shares: 2341, featured: true },
  { id: "2", title: "Me explaining memes to my parents", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=500&fit=crop", category: "Family", likes: 23100, shares: 4521, featured: true },
  { id: "3", title: "POV: You found the perfect meme", imageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=350&fit=crop", category: "Trending", likes: 18900, shares: 3200, featured: true },
  { id: "4", title: "Developer life be like", imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=450&fit=crop", category: "Tech", likes: 31200, shares: 5600, featured: true },
  { id: "5", title: "When coffee kicks in", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop", category: "Relatable", likes: 12800, shares: 1900, featured: true },
  { id: "6", title: "Friday mood activated", imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=500&fit=crop", category: "Weekend", likes: 27500, shares: 4100, featured: true },
  { id: "7", title: "Gym vs Reality", imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=350&fit=crop", category: "Fitness", likes: 19400, shares: 2800, featured: false },
  { id: "8", title: "Cat owners will understand", imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop", category: "Pets", likes: 34200, shares: 6100, featured: true },
  { id: "9", title: "Procrastination level: Expert", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=450&fit=crop", category: "Relatable", likes: 22100, shares: 3800, featured: false },
];

const categories = ["All", "Relatable", "Trending", "Tech", "Pets", "Family", "Weekend", "Fitness"];

export function MemesSection() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredMeme, setHoveredMeme] = useState<string | null>(null);

  const filteredMemes = selectedCategory === "All" 
    ? sampleMemes 
    : sampleMemes.filter(meme => meme.category === selectedCategory);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <section id="memes" className="py-20 md:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-bold text-3xl md:text-5xl mb-4">
            Featured <span className="text-primary">Memes</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-serif">
            The freshest and funniest content from our collection. Scroll, laugh, share, repeat.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
              data-testid={`button-filter-${category.toLowerCase()}`}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
          {filteredMemes.map((meme) => (
            <Card
              key={meme.id}
              className="relative mb-4 md:mb-6 break-inside-avoid overflow-hidden group cursor-pointer"
              onMouseEnter={() => setHoveredMeme(meme.id)}
              onMouseLeave={() => setHoveredMeme(null)}
              data-testid={`card-meme-${meme.id}`}
            >
              <img
                src={meme.imageUrl}
                alt={meme.title}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              
              <div 
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${
                  hoveredMeme === meme.id ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {meme.category}
                  </Badge>
                  <p className="text-white font-medium text-sm md:text-base mb-3 line-clamp-2">
                    {meme.title}
                  </p>
                  <div className="flex items-center gap-4 text-white/90 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {formatNumber(meme.likes || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      {formatNumber(meme.shares || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {meme.featured && (
                <Badge className="absolute top-3 right-3 text-xs">
                  Featured
                </Badge>
              )}
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="gap-2 rounded-full"
            onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
            data-testid="button-view-more-memes"
          >
            View More on Instagram
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
