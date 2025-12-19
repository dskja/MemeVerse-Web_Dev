import { useState } from "react";
import { Heart, Share2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Meme } from "@shared/schema";

export function MemesSection() {
  const [hoveredMeme, setHoveredMeme] = useState<string | null>(null);

  const { data: memesList = [], isLoading } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
  });

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
            The freshest and funniest content from our community. Scroll, laugh, share, repeat.
          </p>
        </div>

        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="mb-4 md:mb-6 break-inside-avoid overflow-hidden">
                <Skeleton className="w-full h-64" />
              </Card>
            ))}
          </div>
        ) : memesList.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
            {memesList.map((meme) => (
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
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No memes yet. Be the first to upload!</p>
            <Button
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login-to-upload"
            >
              Login to Upload
            </Button>
          </div>
        )}

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
