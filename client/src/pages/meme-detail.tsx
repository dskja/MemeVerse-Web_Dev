import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Heart, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, Share2 } from "lucide-react";
import { CommentsSection } from "@/components/comments-section";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Meme, UserProfile } from "@shared/schema";

export default function MemeDetail() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["/api/memes", params.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${params.id}/comments`);
      return res.json();
    },
    enabled: !!params.id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/memes/${params.id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/memes", params.id, "like/status"] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/memes/${params.id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/memes", params.id, "like/status"] });
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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isNaN(videoRef.current.currentTime)) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current && duration && !isNaN(duration) && !isNaN(value[0])) {
      const newTime = (value[0] / 100) * duration;
      if (!isNaN(newTime)) {
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/meme/${meme?.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: meme?.title, url: shareUrl });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!" });
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!" });
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isVideo = meme?.imageUrl?.match(/\.(mp4|webm|mov)$/i) || meme?.imageUrl?.includes("video");
  const progress = duration > 0 && !isNaN(duration) && !isNaN(currentTime) ? Math.min((currentTime / duration) * 100, 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>
        </main>
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
            <Link href="/memes">
              <Button>Back to Memes</Button>
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
      <main className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/memes">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-2xl overflow-hidden border shadow-sm">
                <div className="relative bg-black rounded-t-2xl">
                  {isVideo ? (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        src={meme.imageUrl}
                        loop
                        muted={isMuted}
                        playsInline
                        className="w-full aspect-video object-contain cursor-pointer"
                        onClick={togglePlayPause}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        data-testid="video-player"
                      />
                      
                      {!isPlaying && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
                          onClick={togglePlayPause}
                        >
                          <div className="bg-primary rounded-full p-5 shadow-lg shadow-primary/30 transform transition-transform hover:scale-105">
                            <Play className="h-10 w-10 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src={meme.imageUrl}
                      alt={meme.title}
                      className="w-full aspect-video object-contain"
                    />
                  )}
                </div>

                {isVideo && (
                  <div className="bg-card border-t p-3 space-y-2">
                    <Slider
                      value={[progress]}
                      max={100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                      data-testid="video-progress-slider"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={togglePlayPause}
                          data-testid="button-video-play-pause"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={toggleMute}
                          data-testid="button-video-mute"
                        >
                          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        
                        <span className="text-sm text-muted-foreground ml-2 tabular-nums">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleFullscreen}
                        data-testid="button-video-fullscreen"
                      >
                        <Maximize className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${meme.userId}`}>
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                        <AvatarImage src={profile?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(profile?.displayName || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/profile/${meme.userId}`} className="font-semibold hover:text-primary transition-colors">
                          {profile?.displayName || "User"}
                        </Link>
                        <span className="text-muted-foreground text-sm">
                          {meme.createdAt && formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h1 className="text-lg font-bold mt-1">{meme.title}</h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant={likeStatus?.hasLiked ? "default" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      disabled={likeMutation.isPending || unlikeMutation.isPending}
                      className={`gap-2 rounded-full ${likeStatus?.hasLiked ? "bg-red-500 hover:bg-red-600 border-red-500" : ""}`}
                      data-testid="button-like"
                    >
                      <Heart className={`h-4 w-4 ${likeStatus?.hasLiked ? "fill-current" : ""}`} />
                      {meme.likes || 0}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full"
                      data-testid="button-comments-count"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {comments.length}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="gap-2 rounded-full"
                      data-testid="button-share"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl border shadow-sm sticky top-24">
                <div className="p-4 border-b">
                  <h2 className="font-semibold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Comments ({comments.length})
                  </h2>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-4">
                  <CommentsSection memeId={meme.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
