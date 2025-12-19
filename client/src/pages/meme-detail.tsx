import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Heart, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
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

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
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
      <main className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="px-4 py-3">
            <Link href="/memes">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Memes
              </Button>
            </Link>
          </div>

          <Card className="rounded-none sm:rounded-2xl sm:mx-4 border-x-0 sm:border-x">
            <div className="flex items-center gap-3 p-4 border-b">
              <Link href={`/profile/${meme.userId}`}>
                <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(profile?.displayName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${meme.userId}`} className="font-semibold hover:text-primary transition-colors truncate">
                    {profile?.displayName || "User"}
                  </Link>
                  {meme.featured && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {meme.createdAt && formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true })}
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                Follow
              </Button>
            </div>

            <div className="relative bg-black/95">
              {isVideo ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={meme.imageUrl}
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full max-h-[70vh] object-contain cursor-pointer"
                    onClick={togglePlayPause}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    data-testid="video-player"
                  />
                  
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
                      onClick={togglePlayPause}
                    >
                      <div className="bg-primary rounded-full p-6 shadow-2xl transform transition-all hover:scale-110 hover:bg-primary/90">
                        <Play className="h-12 w-12 text-white fill-white ml-1" />
                      </div>
                    </div>
                  )}

                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4">
                      <Slider
                        value={[progress]}
                        max={100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer [&>span:first-child]:h-1 [&>span:first-child]:bg-white/40 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-lg [&>span:first-child>span]:bg-primary"
                        data-testid="video-progress-slider"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-10 w-10 text-white hover:text-white hover:bg-white/20 rounded-full"
                          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                          data-testid="button-video-play-pause"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-white hover:text-white hover:bg-white/20 rounded-full"
                          onClick={(e) => { e.stopPropagation(); handleRestart(); }}
                          data-testid="button-video-restart"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-white hover:text-white hover:bg-white/20 rounded-full"
                          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                          data-testid="button-video-mute"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        
                        <span className="text-white/90 text-sm font-medium ml-1 tabular-nums">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-white hover:text-white hover:bg-white/20 rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                        data-testid="button-video-fullscreen"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={meme.imageUrl}
                  alt={meme.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLike}
                    disabled={likeMutation.isPending || unlikeMutation.isPending}
                    className={`rounded-full ${likeStatus?.hasLiked ? "text-red-500" : ""}`}
                    data-testid="button-like"
                  >
                    <Heart className={`h-6 w-6 ${likeStatus?.hasLiked ? "fill-current" : ""}`} />
                  </Button>
                  <ShareButton memeId={meme.id} title={meme.title} imageUrl={meme.imageUrl} />
                </div>
              </div>

              {(meme.likes || 0) > 0 && (
                <p className="font-semibold text-sm">
                  {meme.likes} {meme.likes === 1 ? "like" : "likes"}
                </p>
              )}

              <div>
                <p className="text-sm">
                  <Link href={`/profile/${meme.userId}`} className="font-semibold hover:text-primary transition-colors">
                    {profile?.displayName || "User"}
                  </Link>
                  {" "}
                  <span className="text-foreground">{meme.title}</span>
                </p>
              </div>
            </div>

            <div className="border-t">
              <div className="p-4">
                <CommentsSection memeId={meme.id} />
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
