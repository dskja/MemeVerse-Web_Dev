import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Send, Trash2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FramedAvatar } from "@/components/framed-avatar";
import type { Comment, UserProfile, ProfileFrame } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface CommentsSectionProps {
  memeId: string;
}

export function CommentsSection({ memeId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/memes", memeId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${memeId}/comments`);
      return res.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      return apiRequest("POST", `/api/memes/${memeId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", memeId, "comments"] });
      setCommentText("");
      toast({ title: "Comment posted!" });
    },
    onError: () => {
      toast({ title: "Failed to post comment", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest("DELETE", `/api/comments/${commentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", memeId, "comments"] });
      toast({ title: "Comment deleted" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate({ content: commentText.trim() });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm font-medium">{comments.length} Comments</span>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="resize-none flex-1"
            rows={2}
            data-testid="textarea-comment"
          />
          <Button
            type="submit"
            size="icon"
            disabled={createCommentMutation.isPending || !commentText.trim()}
            data-testid="button-post-comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading comments...</p>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={user?.id === comment.userId}
              onDelete={() => deleteCommentMutation.mutate(comment.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
  onDelete: () => void;
}

function CommentItem({
  comment,
  isOwner,
  onDelete,
}: CommentItemProps) {
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile", comment.userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${comment.userId}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-2" data-testid={`comment-${comment.id}`}>
      <div className="flex gap-3">
        <Link href={`/profile/${comment.userId}`}>
          <FramedAvatar
            src={profile?.avatarUrl}
            fallback={(profile?.displayName || "U").charAt(0)}
            size="sm"
            frame={(profile?.profileFrame as ProfileFrame) || "default"}
            profileColor={profile?.profileColor || undefined}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.userId}`} className="font-medium text-sm hover:underline flex items-center gap-1">
              {profile?.displayName || "User"}
              {profile?.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              )}
            </Link>
            <span className="text-xs text-muted-foreground">
              {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <div className="flex items-center gap-2 mt-2">
            {isOwner && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
