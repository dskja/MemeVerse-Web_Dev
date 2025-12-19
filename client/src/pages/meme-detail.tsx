import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Heart, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, Share2, UserPlus } from "lucide-react";
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
  const [showComments, setShowComments] = useState(false);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-lg rounded-lg" />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-50 p-4">
        <Link href="/memes">
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-black/40 backdrop-blur-md text-white hover:bg-black/60 hover:text-white rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        <div className="flex-1 relative flex items-center justify-center bg-black min-h-[60vh] lg:min-h-screen">
          {isVideo ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={meme.imageUrl}
                loop
                muted={isMuted}
                playsInline
                className="max-w-full max-h-[80vh] lg:max-h-[90vh] object-contain cursor-pointer"
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
                  <div className="bg-primary/90 rounded-full p-6 shadow-[0_0_40px_rgba(236,72,153,0.5)] transform transition-all hover:scale-110">
                    <Play className="h-12 w-12 text-white fill-white ml-1" />
                  </div>
                </div>
              )}

              <div 
                className="absolute bottom-0 left-0 right-0 p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-4 space-y-3">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-primary [&_[role=slider]]:shadow-[0_0_10px_rgba(236,72,153,0.8)] [&>span:first-child>span]:bg-primary"
                    data-testid="video-progress-slider"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-white hover:text-white hover:bg-white/10 rounded-full"
                        onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                        data-testid="button-video-play-pause"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-white hover:text-white hover:bg-white/10 rounded-full"
                        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                        data-testid="button-video-mute"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      
                      <span className="text-white/80 text-sm font-medium tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-white hover:text-white hover:bg-white/10 rounded-full"
                      onClick={(e) => { e.stopPropagation(); handleFullscreen(); }}
                      data-testid="button-video-fullscreen"
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={meme.imageUrl}
              alt={meme.title}
              className="max-w-full max-h-[80vh] lg:max-h-[90vh] object-contain"
            />
          )}

          <div className="absolute right-4 bottom-32 lg:bottom-1/3 flex flex-col items-center gap-6">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              className="flex flex-col items-center gap-1 group"
              data-testid="button-like"
            >
              <div className={`p-3 rounded-full bg-black/40 backdrop-blur-md transition-all group-hover:scale-110 ${likeStatus?.hasLiked ? "bg-red-500/20" : ""}`}>
                <Heart className={`h-7 w-7 ${likeStatus?.hasLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
              </div>
              <span className="text-white text-sm font-semibold">{meme.likes || 0}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex flex-col items-center gap-1 group"
              data-testid="button-comments"
            >
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md transition-all group-hover:scale-110">
                <MessageCircle className="h-7 w-7 text-white" />
              </div>
              <span className="text-white text-sm font-semibold">{comments.length}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 group"
              data-testid="button-share"
            >
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md transition-all group-hover:scale-110">
                <Share2 className="h-7 w-7 text-white" />
              </div>
              <span className="text-white text-sm font-semibold">Share</span>
            </button>
          </div>
        </div>

        <div className={`lg:w-96 bg-background border-l border-border flex flex-col ${showComments ? "fixed inset-0 z-50 lg:relative lg:inset-auto" : "hidden lg:flex"}`}>
          <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${meme.userId}`}>
                <Avatar className="h-10 w-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    {(profile?.displayName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${meme.userId}`} className="font-semibold text-sm hover:text-primary transition-colors block truncate">
                  {profile?.displayName || "User"}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {meme.createdAt && formatDistanceToNow(new Date(meme.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-full gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>
              {showComments && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden rounded-full"
                  onClick={() => setShowComments(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 border-b">
            <h1 className="font-bold text-lg leading-tight">{meme.title}</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <CommentsSection memeId={meme.id} />
            </div>
          </div>
        </div>
      </div>

      {!showComments && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${meme.userId}`}>
              <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {(profile?.displayName || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{profile?.displayName || "User"}</p>
              <p className="text-white/70 text-sm truncate">{meme.title}</p>
            </div>
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white">
              Follow
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
