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

              {isVideo ? (
                <div className="relative rounded-lg overflow-hidden mb-4 bg-black">
                  <video
                    ref={videoRef}
                    src={meme.imageUrl}
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full cursor-pointer"
                    onClick={togglePlayPause}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    data-testid="video-player"
                  />
                  
                  {!isPlaying && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={togglePlayPause}
                    >
                      <div className="bg-primary/90 rounded-full p-5 shadow-xl transform transition-transform hover:scale-105">
                        <Play className="h-14 w-14 text-white fill-white ml-1" />
                      </div>
                    </div>
                  )}

                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 pb-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-3">
                      <Slider
                        value={[progress]}
                        max={100}
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer [&>span:first-child]:h-1.5 [&>span:first-child]:bg-white/30 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-2 [&>span:first-child>span]:bg-primary"
                        data-testid="video-progress-slider"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
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
                        
                        <div className="flex items-center gap-1 ml-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-white hover:text-white hover:bg-white/20 rounded-full"
                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                            data-testid="button-video-mute"
                          >
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                        </div>
                        
                        <span className="text-white text-sm font-medium ml-2 tabular-nums">
                          {formatTime(currentTime)} <span className="text-white/60">/</span> {formatTime(duration)}
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
                  className="w-full rounded-lg mb-4"
                />
              )}

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
