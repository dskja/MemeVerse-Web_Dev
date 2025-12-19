import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { MemeDetailModal } from "@/components/meme-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Heart, Share2, UserPlus, UserMinus, Edit2, Image, Trash2, Star, Flame, Medal, Crown, Award, Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Meme, UserProfile, Badge as BadgeType, UserBadge } from "@shared/schema";

const levelConfig: Record<string, { icon: typeof Star; color: string; label: string; minXp: number; maxXp: number }> = {
  newbie: { icon: Star, color: "text-muted-foreground", label: "Newbie", minXp: 0, maxXp: 100 },
  meme_fan: { icon: Flame, color: "text-blue-500", label: "Meme Fan", minXp: 100, maxXp: 500 },
  meme_master: { icon: Medal, color: "text-purple-500", label: "Meme Master", minXp: 500, maxXp: 2000 },
  meme_lord: { icon: Crown, color: "text-yellow-500", label: "Meme Lord", minXp: 2000, maxXp: 10000 },
};

export default function Profile() {
  const params = useParams<{ userId?: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

  const userId = params.userId || user?.id;
  const isOwnProfile = user?.id === userId;

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile", userId],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: memesList = [], isLoading: memesLoading } = useQuery<Meme[]>({
    queryKey: ["/api/memes/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/memes/user/${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: counts } = useQuery<{ followerCount: number; followingCount: number }>({
    queryKey: ["/api/follow", userId, "counts"],
    queryFn: async () => {
      const res = await fetch(`/api/follow/${userId}/counts`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ["/api/follow", userId, "status"],
    queryFn: async () => {
      const res = await fetch(`/api/follow/${userId}/status`, { credentials: "include" });
      if (res.status === 401) return { isFollowing: false };
      return res.json();
    },
    enabled: !!userId && !isOwnProfile && !!user,
  });

  const { data: userBadges = [] } = useQuery<(UserBadge & { badge: BadgeType })[]>({
    queryKey: ["/api/users", userId, "badges"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/badges`);
      return res.json();
    },
    enabled: !!userId,
  });


  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/follow/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow", userId] });
      toast({ title: "Following!" });
    },
    onError: () => {
      toast({ title: "Failed to follow", variant: "destructive" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/follow/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow", userId] });
      toast({ title: "Unfollowed" });
    },
    onError: () => {
      toast({ title: "Failed to unfollow", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (memeId: string) => {
      return apiRequest("DELETE", `/api/memes/${memeId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes/user", userId] });
      toast({ title: "Meme deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete meme", variant: "destructive" });
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Profile</h1>
            <p className="text-muted-foreground mb-6">Please login to view your profile</p>
            <Button onClick={() => window.location.href = "/api/login"}>
              Login
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = profile?.displayName || user?.firstName || "User";
  const avatarUrl = profile?.avatarUrl || user?.profileImageUrl;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-2xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const level = profile?.level || "newbie";
                          const config = levelConfig[level] || levelConfig.newbie;
                          const LevelIcon = config.icon;
                          return (
                            <Badge variant="outline" className={`gap-1 ${config.color}`}>
                              <LevelIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          );
                        })()}
                        <span className="text-sm text-muted-foreground">{profile?.xp || 0} XP</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {isOwnProfile ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                          data-testid="button-edit-profile"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      ) : user ? (
                        followStatus?.isFollowing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unfollowMutation.mutate()}
                            disabled={unfollowMutation.isPending}
                            data-testid="button-unfollow"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Unfollow
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => followMutation.mutate()}
                            disabled={followMutation.isPending}
                            data-testid="button-follow"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-6 mt-4 text-sm">
                    <div data-testid="stat-memes">
                      <span className="font-bold">{memesList.length}</span>
                      <span className="text-muted-foreground ml-1">Memes</span>
                    </div>
                    <div data-testid="stat-followers">
                      <span className="font-bold">{counts?.followerCount || 0}</span>
                      <span className="text-muted-foreground ml-1">Followers</span>
                    </div>
                    <div data-testid="stat-following">
                      <span className="font-bold">{counts?.followingCount || 0}</span>
                      <span className="text-muted-foreground ml-1">Following</span>
                    </div>
                  </div>

                  {(() => {
                    const level = profile?.level || "newbie";
                    const xp = profile?.xp || 0;
                    const config = levelConfig[level] || levelConfig.newbie;
                    const nextLevelKey = level === "newbie" ? "meme_fan" : level === "meme_fan" ? "meme_master" : level === "meme_master" ? "meme_lord" : null;
                    const nextConfig = nextLevelKey ? levelConfig[nextLevelKey] : null;
                    const xpInCurrentLevel = xp - config.minXp;
                    const xpNeededForLevel = nextConfig ? nextConfig.minXp - config.minXp : 0;
                    const progress = nextConfig ? Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100) : 100;
                    return (
                      <div className="mt-4 space-y-3 bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">XP Progress</span>
                          {nextConfig ? (
                            <span className="text-sm font-medium">{xpInCurrentLevel} / {xpNeededForLevel}</span>
                          ) : (
                            <span className="text-yellow-500 font-bold text-sm">Max Level!</span>
                          )}
                        </div>
                        <Progress value={progress} className="h-2" />
                        {nextConfig && (
                          <p className="text-xs text-muted-foreground">
                            {xpNeededForLevel - xpInCurrentLevel} XP until <strong>{nextConfig.label}</strong>
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {profile?.bio ? (
                    <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                  ) : isOwnProfile ? (
                    <p className="mt-4 text-muted-foreground italic">{t.profile.bio}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="memes" className="w-full">
            <TabsList className="w-full justify-start gap-1 flex-wrap">
              <TabsTrigger value="memes" className="gap-2">
                <Image className="h-4 w-4" />
                Memes
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-2">
                <Award className="h-4 w-4" />
                Badges ({userBadges.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="memes" className="mt-6">
              {memesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-md" />
                  ))}
                </div>
              ) : memesList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {memesList.map((meme) => {
                    const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i);
                    return (
                      <Card 
                        key={meme.id} 
                        className="relative overflow-hidden group cursor-pointer" 
                        data-testid={`card-user-meme-${meme.id}`}
                        onClick={() => setSelectedMeme(meme)}
                      >
                        {isVideo ? (
                          <div className="relative w-full aspect-square bg-muted flex items-center justify-center">
                            <video
                              src={meme.imageUrl}
                              className="w-full aspect-square object-cover"
                              muted
                            />
                            <Play className="absolute h-10 w-10 text-white drop-shadow-lg" />
                          </div>
                        ) : (
                          <img
                            src={meme.imageUrl}
                            alt={meme.title}
                            className="w-full aspect-square object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <span className="text-white flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {formatNumber(meme.likes || 0)}
                          </span>
                          <span className="text-white flex items-center gap-1">
                            <Share2 className="h-4 w-4" />
                            {formatNumber(meme.shares || 0)}
                          </span>
                          {isOwnProfile && (
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(meme.id);
                              }}
                              data-testid={`button-delete-meme-${meme.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {meme.featured && (
                          <Badge className="absolute top-2 left-2 text-xs">Featured</Badge>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't uploaded any memes yet" : "No memes uploaded yet"}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges" className="mt-6">
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userBadges.map((ub) => (
                    <Card key={ub.id} className="p-4 text-center" data-testid={`badge-${ub.badge.slug}`}>
                      <div className="text-4xl mb-2">{ub.badge.icon}</div>
                      <h3 className="font-medium text-sm">{ub.badge.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{ub.badge.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">+{ub.badge.xpReward} XP</Badge>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload memes, get likes, and participate in contests to earn badges!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile || null}
        userId={userId || ""}
      />

      <MemeDetailModal
        meme={selectedMeme}
        isOpen={!!selectedMeme}
        onClose={() => setSelectedMeme(null)}
      />
    </div>
  );
}
