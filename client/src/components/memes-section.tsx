import { useState } from "react";
import { Link } from "wouter";
import { Heart, ExternalLink, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meme } from "@shared/schema";

export function MemesSection() {
  const [hoveredMeme, setHoveredMeme] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

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
              <MemeCard
                key={meme.id}
                meme={meme}
                user={user}
                hoveredMeme={hoveredMeme}
                setHoveredMeme={setHoveredMeme}
                formatNumber={formatNumber}
              />
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

function MemeCard({
  meme,
  user,
  hoveredMeme,
  setHoveredMeme,
  formatNumber,
}: {
  meme: Meme;
  user: any;
  hoveredMeme: string | null;
  setHoveredMeme: (id: string | null) => void;
  formatNumber: (num: number) => string;
}) {
  const { toast } = useToast();
  const [localLikes, setLocalLikes] = useState(meme.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);

  const { data: likeStatus } = useQuery<{ hasLiked: boolean }>({
    queryKey: ["/api/memes", meme.id, "like", "status"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${meme.id}/like/status`);
      return res.json();
    },
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (hasLiked || likeStatus?.hasLiked) {
        await apiRequest("DELETE", `/api/memes/${meme.id}/like`);
        return { liked: false };
      } else {
        return apiRequest("POST", `/api/memes/${meme.id}/like`, {});
      }
    },
    onSuccess: (data: any) => {
      if (data?.liked === false || (hasLiked || likeStatus?.hasLiked)) {
        setLocalLikes((prev) => Math.max(0, prev - 1));
        setHasLiked(false);
      } else {
        setLocalLikes((prev) => prev + 1);
        setHasLiked(true);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memes", meme.id, "like", "status"] });
    },
    onError: () => {
      toast({ title: "Please login to like", variant: "destructive" });
    },
  });

  const isLiked = hasLiked || likeStatus?.hasLiked;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please login to like memes" });
      return;
    }
    likeMutation.mutate();
  };

  return (
    <Card
      className="relative mb-4 md:mb-6 break-inside-avoid overflow-hidden group"
      onMouseEnter={() => setHoveredMeme(meme.id)}
      onMouseLeave={() => setHoveredMeme(null)}
      data-testid={`card-meme-${meme.id}`}
    >
      <Link href={`/meme/${meme.id}`}>
        <img
          src={meme.imageUrl}
          alt={meme.title}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
          loading="lazy"
        />
      </Link>
      
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 pointer-events-none ${
          hoveredMeme === meme.id ? "opacity-100" : "opacity-0 sm:opacity-0"
        } opacity-100 sm:opacity-0`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-medium text-sm md:text-base mb-3 line-clamp-2">
            {meme.title}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
        <Button
          size="sm"
          variant="ghost"
          className={`gap-1 text-white hover:text-white ${isLiked ? "text-red-500" : ""}`}
          onClick={handleLike}
          disabled={likeMutation.isPending}
          data-testid={`button-like-${meme.id}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current text-red-500" : ""}`} />
          {formatNumber(localLikes)}
        </Button>
        <Link href={`/meme/${meme.id}`}>
          <Button size="sm" variant="ghost" className="gap-1 text-white hover:text-white" data-testid={`button-view-${meme.id}`}>
            <MessageCircle className="h-4 w-4" />
            View
          </Button>
        </Link>
      </div>

      {meme.featured && (
        <Badge className="absolute top-3 right-3 text-xs">
          Featured
        </Badge>
      )}
    </Card>
  );
}
