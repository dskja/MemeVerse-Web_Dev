import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Send, Reply, Trash2, BadgeCheck } from "lucide-react";
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/memes", memeId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${memeId}/comments`);
      return res.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { body: string; parentCommentId?: string }) => {
      return apiRequest("POST", `/api/memes/${memeId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes", memeId, "comments"] });
      setCommentText("");
      setReplyText("");
      setReplyingTo(null);
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
    createCommentMutation.mutate({ body: commentText.trim() });
  };

  const handleReply = (parentId: string) => {
    if (!replyText.trim()) return;
    createCommentMutation.mutate({ body: replyText.trim(), parentCommentId: parentId });
  };

  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId);

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
      ) : topLevelComments.length > 0 ? (
        <div className="space-y-4">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              isOwner={user?.id === comment.authorId}
              canReply={!!user}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyingTo={setReplyingTo}
              setReplyText={setReplyText}
              onReply={handleReply}
              onDelete={() => deleteCommentMutation.mutate(comment.id)}
              isReplying={createCommentMutation.isPending}
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
  replies: Comment[];
  isOwner: boolean;
  canReply: boolean;
  replyingTo: string | null;
  replyText: string;
  setReplyingTo: (id: string | null) => void;
  setReplyText: (text: string) => void;
  onReply: (parentId: string) => void;
  onDelete: () => void;
  isReplying: boolean;
}

function CommentItem({
  comment,
  replies,
  isOwner,
  canReply,
  replyingTo,
  replyText,
  setReplyingTo,
  setReplyText,
  onReply,
  onDelete,
  isReplying,
}: CommentItemProps) {
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile", comment.authorId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${comment.authorId}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-2" data-testid={`comment-${comment.id}`}>
      <div className="flex gap-3">
        <Link href={`/profile/${comment.authorId}`}>
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
            <Link href={`/profile/${comment.authorId}`} className="font-medium text-sm hover:underline flex items-center gap-1">
              {profile?.displayName || "User"}
              {profile?.isVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              )}
            </Link>
            <span className="text-xs text-muted-foreground">
              {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.body}</p>
          <div className="flex items-center gap-2 mt-2">
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            {isOwner && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {replyingTo === comment.id && (
        <div className="ml-11 flex gap-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="resize-none flex-1 text-sm"
            rows={2}
            data-testid={`textarea-reply-${comment.id}`}
          />
          <Button
            size="icon"
            disabled={isReplying || !replyText.trim()}
            onClick={() => onReply(comment.id)}
            data-testid={`button-post-reply-${comment.id}`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-11 space-y-2 border-l-2 border-muted pl-4">
          {replies.map((reply) => (
            <ReplyItem key={reply.id} comment={reply} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReplyItem({ comment, isOwner }: { comment: Comment; isOwner: boolean }) {
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile", comment.authorId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${comment.authorId}`);
      return res.json();
    },
  });

  return (
    <div className="flex gap-2" data-testid={`reply-${comment.id}`}>
      <FramedAvatar
        src={profile?.avatarUrl}
        fallback={(profile?.displayName || "U").charAt(0)}
        size="xs"
        frame={(profile?.profileFrame as ProfileFrame) || "default"}
        profileColor={profile?.profileColor || undefined}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs flex items-center gap-1">
            {profile?.displayName || "User"}
            {profile?.isVerified && (
              <BadgeCheck className="h-3 w-3 text-blue-500 flex-shrink-0" />
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm">{comment.body}</p>
      </div>
    </div>
  );
}
