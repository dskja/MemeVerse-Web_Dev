import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Vote, Image, CheckCircle, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Contest, ContestEntry, Meme } from "@shared/schema";

export default function Contests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: activeContest, isLoading: contestLoading } = useQuery<Contest | null>({
    queryKey: ["/api/contests/active"],
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery<ContestEntry[]>({
    queryKey: ["/api/contests", activeContest?.id, "entries"],
    queryFn: async () => {
      if (!activeContest?.id) return [];
      const res = await fetch(`/api/contests/${activeContest.id}/entries`);
      return res.json();
    },
    enabled: !!activeContest?.id,
  });

  const { data: userMemes = [] } = useQuery<Meme[]>({
    queryKey: ["/api/memes/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/memes/user/${user.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const submitEntryMutation = useMutation({
    mutationFn: async (memeId: string) => {
      return apiRequest("POST", `/api/contests/${activeContest?.id}/entries`, { memeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests", activeContest?.id, "entries"] });
      toast({ title: t.contests.submitEntry + "!" });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  const removeEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return apiRequest("DELETE", `/api/contests/entries/${entryId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests", activeContest?.id, "entries"] });
      toast({ title: t.contests.entryRemoved || "Entry removed!" });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return apiRequest("POST", `/api/contests/entries/${entryId}/vote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests", activeContest?.id, "entries"] });
      toast({ title: t.contests.vote + "!" });
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  const userEntry = entries.find((e) => e.userId === user?.id);
  const userHasEntered = !!userEntry;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t.contests.title}</h1>
            <p className="text-muted-foreground mt-2">{t.contests.checkBackLater}</p>
          </div>

          {contestLoading ? (
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : activeContest ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle>{activeContest.title}</CardTitle>
                      {activeContest.description && (
                        <CardDescription className="mt-2">{activeContest.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {t.contests.endsIn} {activeContest.endsAt && formatDistanceToNow(new Date(activeContest.endsAt))}
                    </Badge>
                  </div>
                  {activeContest.theme && (
                    <p className="text-sm text-primary mt-2">{t.contests.theme}: {activeContest.theme}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {user ? (
                    userHasEntered ? (
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          {t.contests.submitEntry}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => userEntry && removeEntryMutation.mutate(userEntry.id)}
                          disabled={removeEntryMutation.isPending}
                          data-testid="button-remove-entry"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t.contests.removeEntry || "Remove Entry"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {t.contests.submitEntry}:
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {userMemes.map((meme) => {
                            const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i);
                            return (
                              <button
                                key={meme.id}
                                onClick={() => submitEntryMutation.mutate(meme.id)}
                                disabled={submitEntryMutation.isPending}
                                className="aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors relative"
                                data-testid={`button-submit-meme-${meme.id}`}
                              >
                                {isVideo ? (
                                  <>
                                    <video src={meme.imageUrl} className="w-full h-full object-cover" muted />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <Play className="h-6 w-6 text-white fill-white" />
                                    </div>
                                  </>
                                ) : (
                                  <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-cover" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {userMemes.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t.memes.noMemes}{" "}
                            <Link href="/upload" className="text-primary hover:underline">
                              {t.memes.uploadFirst}
                            </Link>
                          </p>
                        )}
                      </div>
                    )
                  ) : (
                    <Button onClick={() => (window.location.href = "/api/login")}>
                      {t.nav.login}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <div>
                <h2 className="text-xl font-bold mb-4">{t.contests.entries} ({entries.length})</h2>
                {entriesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="aspect-square rounded-md" />
                    ))}
                  </div>
                ) : entries.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {entries.map((entry, index) => (
                      <ContestEntryCard
                        key={entry.id}
                        entry={entry}
                        rank={index + 1}
                        canVote={!!user && entry.userId !== user.id}
                        isOwner={user?.id === entry.userId}
                        onVote={() => voteMutation.mutate(entry.id)}
                        onRemove={() => removeEntryMutation.mutate(entry.id)}
                        isVoting={voteMutation.isPending}
                        isRemoving={removeEntryMutation.isPending}
                        t={t}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t.memes.noMemes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">{t.contests.noActiveContest}</h2>
                <p className="text-muted-foreground">{t.contests.checkBackLater}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ContestEntryCard({
  entry,
  rank,
  canVote,
  isOwner,
  onVote,
  onRemove,
  isVoting,
  isRemoving,
  t,
}: {
  entry: ContestEntry;
  rank: number;
  canVote: boolean;
  isOwner: boolean;
  onVote: () => void;
  onRemove: () => void;
  isVoting: boolean;
  isRemoving: boolean;
  t: any;
}) {
  const { data: meme } = useQuery<Meme>({
    queryKey: ["/api/memes", entry.memeId],
    queryFn: async () => {
      const res = await fetch(`/api/memes/${entry.memeId}`);
      return res.json();
    },
  });

  const isVideo = meme?.imageUrl?.match(/\.(mp4|webm|mov)$/i);

  return (
    <Card className="overflow-hidden" data-testid={`contest-entry-${entry.id}`}>
      {meme && (
        <Link href={`/meme/${meme.id}`}>
          <div className="relative">
            {isVideo ? (
              <>
                <video src={meme.imageUrl} className="w-full aspect-square object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </>
            ) : (
              <img src={meme.imageUrl} alt={meme.title} className="w-full aspect-square object-cover" />
            )}
          </div>
        </Link>
      )}
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {rank <= 3 && (
              <span className={`text-lg font-bold ${rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : "text-amber-600"}`}>
                #{rank}
              </span>
            )}
            <span className="text-sm font-medium">{entry.votes || 0} {t.contests.votes}</span>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={onRemove} 
                disabled={isRemoving}
                data-testid={`button-remove-entry-${entry.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            {canVote && (
              <Button size="sm" variant="outline" onClick={onVote} disabled={isVoting} data-testid={`button-vote-${entry.id}`}>
                <Vote className="h-3 w-3 mr-1" />
                {t.contests.vote}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
