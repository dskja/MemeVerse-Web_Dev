import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Heart, MessageCircle, Share2, Send, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meme, Comment } from "@shared/schema";

interface MemeDetailModalProps {
  meme: Meme | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MemeDetailModal({ meme, isOpen, onClose }: MemeDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, meme?.id]);

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/memes", meme?.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${meme?.id}/comments`);
      return res.json();
    },
    enabled: !!meme?.id && isOpen,
  });

  const { data: isFavorite } = useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites", meme?.id, "check"],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/${meme?.id}/check`, { credentials: "include" });
      if (!res.ok) return { isFavorite: false };
      return res.json();
    },
    enabled: !!meme?.id && isOpen && !!user,
  });

  useEffect(() => {
    if (isFavorite?.isFavorite !== undefined) {
      setFavorited(isFavorite.isFavorite);
    }
  }, [isFavorite]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/memes/${meme?.id}/like`, {});
    },
    onSuccess: () => {
      setLiked(true);
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/favorites/${meme?.id}`, {});
    },
    onSuccess: () => {
      setFavorited(true);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", meme?.id, "check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: t.memes?.addToFavorites || "Added to favorites" });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/favorites/${meme?.id}`, {});
    },
    onSuccess: () => {
      setFavorited(false);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", meme?.id, "check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: t.memes?.removeFromFavorites || "Removed from favorites" });
    },
  });

  const handleToggleFavorite = () => {
    if (!user) {
      toast({ title: "Please login to add favorites" });
      return;
    }
    if (favorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      return apiRequest("POST", `/api/memes/${meme?.id}/comments`, { body });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/memes", meme?.id, "comments"] });
      toast({ title: t.memes.comments });
    },
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/meme/${meme?.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: meme?.title,
          url: shareUrl,
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!" });
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!" });
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

  if (!meme) return null;

  const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i) || meme.imageUrl?.includes("video");
  const progress = duration > 0 && !isNaN(duration) && !isNaN(currentTime) ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div ref={modalContentRef} className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
          <div 
            className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px] relative"
          >
            {isVideo ? (
              <>
                <video
                  ref={videoRef}
                  src={meme.imageUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="max-w-full max-h-full object-contain cursor-pointer"
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
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4 pb-6"
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
              </>
            ) : (
              <img
                src={meme.imageUrl}
                alt={meme.title}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          <div className="w-full md:w-80 flex flex-col bg-background border-l">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg truncate">{meme.title}</DialogTitle>
              {meme.featured && (
                <Badge variant="secondary" className="w-fit">Featured</Badge>
              )}
            </DialogHeader>

            <div className="flex items-center gap-2 p-4 border-b flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${liked ? "text-red-500" : ""}`}
                onClick={() => user && likeMutation.mutate()}
                disabled={!user}
                data-testid="button-like-meme"
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                {(meme.likes || 0) + (liked ? 1 : 0)}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-comments-count">
                <MessageCircle className="h-5 w-5" />
                {comments.length}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${favorited ? "text-yellow-500" : ""}`}
                onClick={handleToggleFavorite}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                data-testid="button-favorite-meme"
              >
                <Star className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare} data-testid="button-share-meme">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t.memes.noMemes}
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">{comment.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {user && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={t.memes.addComment}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && commentText && commentMutation.mutate(commentText)}
                  />
                  <Button
                    size="icon"
                    onClick={() => commentText && commentMutation.mutate(commentText)}
                    disabled={!commentText || commentMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
