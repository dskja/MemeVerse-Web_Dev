import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";
import { ShareButton } from "@/components/share-button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Meme, UserProfile } from "@shared/schema";

export default function MemeDetail() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: meme, isLoading } = useQuery<Meme>({
    queryKey: ["/api/memes", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${params.id}`);
      if (!res.ok) throw new Error("Meme not found");
      return res.json();
    },
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile", meme?.userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${meme?.userId}`);
      return res.json();
    },
    enabled: !!meme?.userId,
  });

  const { data: likeStatus } = useQuery<{ hasLiked: boolean }>({
    queryKey: ["/api/memes", params.id, "like/status"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${params.id}/like/status`, { credentials: "include" });
      if (res.status === 401) return { hasLiked: false };
      return res.json();
    },
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/memes/${params.id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", params.id] });
      toast({ title: "Liked!" });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/memes/${params.id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", params.id] });
    },
  });

  const handleLike = () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    if (likeStatus?.hasLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!meme) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Meme not found</h1>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/profile/${meme.userId}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatarUrl || undefined} />
                    <AvatarFallback>
                      {(profile?.displayName || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <Link href={`/profile/${meme.userId}`} className="font-medium hover:underline">
                    {profile?.displayName || "User"}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {meme.createdAt && formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {meme.featured && <Badge>Featured</Badge>}
              </div>

              <h1 className="text-xl font-bold mb-4">{meme.title}</h1>

              <img
                src={meme.imageUrl}
                alt={meme.title}
                className="w-full rounded-lg mb-4"
              />

              <div className="flex items-center gap-4">
                <Button
                  variant={likeStatus?.hasLiked ? "default" : "ghost"}
                  size="sm"
                  onClick={handleLike}
                  disabled={likeMutation.isPending || unlikeMutation.isPending}
                  className="gap-1"
                  data-testid="button-like"
                >
                  <Heart className={`h-4 w-4 ${likeStatus?.hasLiked ? "fill-current" : ""}`} />
                  {meme.likes || 0}
                </Button>
                
                <ShareButton memeId={meme.id} title={meme.title} imageUrl={meme.imageUrl} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <CommentsSection memeId={meme.id} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
