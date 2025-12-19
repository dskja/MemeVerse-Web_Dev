import { useState } from "react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  MessageCircle, 
  Play, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  Flame,
  ImageIcon
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meme } from "@shared/schema";

type SortOption = "trending" | "newest" | "popular";

export default function MemesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [hoveredMeme, setHoveredMeme] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: memesList = [], isLoading } = useQuery<Meme[]>({
    queryKey: ["/api/memes"],
  });

  const filteredMemes = memesList
    .filter(meme => 
      searchQuery === "" || 
      meme.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "popular":
          return (b.likes || 0) - (a.likes || 0);
        case "trending":
        default:
          return (b.likes || 0) - (a.likes || 0);
      }
    });

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const sortOptions: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
    { value: "trending", label: t.memesPage.trending, icon: Flame },
    { value: "newest", label: t.memesPage.newest, icon: Clock },
    { value: "popular", label: t.memesPage.mostLiked, icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-16">
        <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                {t.nav.memes}
              </Badge>
              <h1 className="font-bold text-4xl md:text-5xl mb-4">
                {t.memesPage.title.split(" ")[0]} <span className="text-primary">{t.memesPage.title.split(" ")[1] || "Memes"}</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t.memesPage.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.memesPage.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-memes"
                />
              </div>

              <div className="flex gap-2">
                {sortOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={sortBy === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option.value)}
                    className="gap-2"
                    data-testid={`button-sort-${option.value}`}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {filteredMemes.length} {t.memesPage.memesFound}
              </p>
            </div>

            {isLoading ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i} className="mb-4 md:mb-6 break-inside-avoid overflow-hidden">
                    <Skeleton className="w-full h-64" />
                  </Card>
                ))}
              </div>
            ) : filteredMemes.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
                {filteredMemes.map((meme) => (
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
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.memes.noMemes}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? t.memesPage.tryDifferentSearch : t.memes.uploadFirst}
                </p>
                {user && (
                  <Link href="/upload">
                    <Button data-testid="button-upload-first-meme">
                      {t.memesPage.uploadFirst}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
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
  const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i) || meme.imageUrl?.includes("video");

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
      data-testid={`card-meme-page-${meme.id}`}
    >
      <Link href={`/meme/${meme.id}`}>
        {isVideo ? (
          <div className="relative">
            <video
              src={meme.imageUrl}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              muted
              loop
              playsInline
              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
              onMouseLeave={(e) => {
                const video = e.target as HTMLVideoElement;
                video.pause();
                video.currentTime = 0;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
              <div className="bg-primary/90 rounded-full p-3">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={meme.imageUrl}
            alt={meme.title}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
            loading="lazy"
          />
        )}
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
          data-testid={`button-like-page-${meme.id}`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current text-red-500" : ""}`} />
          {formatNumber(localLikes)}
        </Button>
        <Link href={`/meme/${meme.id}`}>
          <Button size="sm" variant="ghost" className="gap-1 text-white hover:text-white" data-testid={`button-view-page-${meme.id}`}>
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
