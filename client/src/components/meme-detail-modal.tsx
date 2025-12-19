import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Send, X } from "lucide-react";
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

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/memes", meme?.id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${meme?.id}/comments`);
      return res.json();
    },
    enabled: !!meme?.id && isOpen,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/memes/${meme?.id}/like`, {});
    },
    onSuccess: () => {
      setLiked(true);
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
    },
  });

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

  if (!meme) return null;

  const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i) || meme.imageUrl?.includes("video");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {isVideo ? (
              <video
                src={meme.imageUrl}
                controls
                autoPlay
                loop
                muted
                className="max-w-full max-h-full object-contain"
              />
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

            <div className="flex items-center gap-4 p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 ${liked ? "text-red-500" : ""}`}
                onClick={() => user && likeMutation.mutate()}
                disabled={!user}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                {(meme.likes || 0) + (liked ? 1 : 0)}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                {comments.length}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
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
