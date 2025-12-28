import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { MemeDetailModal } from "@/components/meme-detail-modal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, UserPlus, UserMinus, Image, Trash2, Star as StarIcon, Flame, Medal, Crown, 
  Award, Play, Upload, MessageCircle, Users, Settings, 
  Zap, TrendingUp, Grid3X3, Trophy, Share2, Globe, BadgeCheck, type LucideIcon
} from "lucide-react";
import { FramedAvatar } from "@/components/framed-avatar";
import type { ProfileFrame } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Meme, UserProfile, Badge as BadgeType, UserBadge, XpEvent, Follower, SocialLink } from "@shared/schema";

type ProfileOverview = {
  profile: UserProfile | null;
  memeCount: number;
  followerCount: number;
  followingCount: number;
  badges: (UserBadge & { badge: BadgeType })[];
  socialLinks: SocialLink[];
  stats: any;
  totalLikes: number;
};

type FollowerWithProfile = Follower & { profile: UserProfile | null };

const levelConfig: Record<string, { icon: typeof StarIcon; color: string; bgGradient: string; label: string; minXp: number; maxXp: number }> = {
  newbie: { icon: StarIcon, color: "text-muted-foreground", bgGradient: "from-gray-400 to-gray-600", label: "Newbie", minXp: 0, maxXp: 100 },
  meme_fan: { icon: Flame, color: "text-blue-500", bgGradient: "from-blue-400 to-blue-600", label: "Meme Fan", minXp: 100, maxXp: 500 },
  meme_master: { icon: Medal, color: "text-purple-500", bgGradient: "from-purple-400 to-purple-600", label: "Meme Master", minXp: 500, maxXp: 2000 },
  meme_lord: { icon: Crown, color: "text-yellow-500", bgGradient: "from-yellow-400 to-yellow-600", label: "Meme Lord", minXp: 2000, maxXp: 10000 },
};

const socialIcons: Record<string, LucideIcon> = {
  twitter: Share2,
  instagram: Share2,
  tiktok: Share2,
  youtube: Share2,
  discord: Share2,
  website: Globe,
};

function FollowersSheet({ userId, type, count }: { userId: string; type: "followers" | "following"; count: number }) {
  const { data: list = [], isLoading } = useQuery<FollowerWithProfile[]>({
    queryKey: ["/api/profile", userId, type],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}/${type}`);
      return res.json();
    },
  });
  const { t } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-center active:scale-95 transition-transform" data-testid={`button-view-${type}`}>
          <p className="text-xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">
            {type === "followers" ? t.profile?.followers || "Followers" : t.profile?.following || "Following"}
          </p>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="capitalize">{type === "followers" ? t.profile?.followers || "Followers" : t.profile?.following || "Following"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2 overflow-y-auto max-h-[calc(70vh-80px)]">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </p>
          ) : (
            list.map((item) => {
              const profile = item.profile;
              const targetUserId = type === "followers" ? item.followerId : item.followingId;
              return (
                <Link key={item.id} href={`/profile/${targetUserId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover-elevate active-elevate-2 cursor-pointer">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(profile?.displayName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{profile?.displayName || "User"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {profile?.xp || 0} XP
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Profile() {
  const params = useParams<{ userId?: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);

  const userId = params.userId || user?.id;
  const isOwnProfile = user?.id === userId;

  const { data: overview, isLoading: overviewLoading } = useQuery<ProfileOverview>({
    queryKey: ["/api/profile", userId, "overview"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}/overview`);
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

  const { data: xpEvents = [] } = useQuery<XpEvent[]>({
    queryKey: ["/api/profile", userId, "xp-events"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}/xp-events?limit=10`);
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

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Meme[]>({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOwnProfile && !!user,
  });

  const followMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/follow/${userId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId, "overview"] });
      toast({ title: t.toasts.following });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/follow/${userId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId, "overview"] });
      toast({ title: t.toasts.unfollowed });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (memeId: string) => apiRequest("DELETE", `/api/memes/${memeId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes/user", userId] });
      toast({ title: t.toasts.memeDeleted });
    },
  });

  const profile = overview?.profile;
  const level = (profile?.level || "newbie") as string;
  const config = levelConfig[level] || levelConfig.newbie;
  const LevelIcon = config.icon;

  if (authLoading || overviewLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16 pb-16">
          <div className="max-w-lg mx-auto px-4 space-y-4">
            <div className="bg-card rounded-2xl border p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            </div>
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
          <div className="max-w-lg mx-auto text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t.profile?.title || "Profile"}</h1>
            <p className="text-muted-foreground mb-6">{t.profile?.loginPrompt || "Please login to view your profile"}</p>
            <Button onClick={() => window.location.href = "/api/login"} className="h-11 px-8 rounded-full">
              {t.nav.login}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = profile?.displayName || user?.firstName || "User";
  const avatarUrl = profile?.avatarUrl || user?.profileImageUrl;
  const totalLikes = overview?.totalLikes || 0;

  const xpSourceLabels: Record<string, { label: string; icon: typeof Upload; color: string }> = {
    upload: { label: t.xp.uploadMeme, icon: Upload, color: "text-green-500" },
    like_received: { label: t.xp.receiveLike, icon: Heart, color: "text-red-500" },
    comment: { label: t.xp.getComment, icon: MessageCircle, color: "text-blue-500" },
    comment_received: { label: "Comment received", icon: MessageCircle, color: "text-cyan-500" },
    follow_received: { label: t.xp.gainFollower, icon: Users, color: "text-purple-500" },
  };

  const nextLevel = level === "newbie" ? "meme_fan" : level === "meme_fan" ? "meme_master" : level === "meme_master" ? "meme_lord" : null;
  const nextConfig = nextLevel ? levelConfig[nextLevel] : null;
  const currentXp = profile?.xp || 0;
  const xpProgress = nextConfig ? Math.min(100, ((currentXp - config.minXp) / (nextConfig.minXp - config.minXp)) * 100) : 100;
  const xpToNext = nextConfig ? nextConfig.minXp - currentXp : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16 pb-24">
        <div className="max-w-lg mx-auto px-4 space-y-4">
          
          {/* Profile Header Card */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            {/* Gradient Banner */}
            <div className={`h-20 bg-gradient-to-r ${config.bgGradient}`} />
            
            <div className="px-5 pb-5">
              {/* Avatar overlapping banner */}
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <FramedAvatar
                  src={avatarUrl}
                  fallback={displayName.charAt(0).toUpperCase()}
                  frame={profile?.profileFrame as ProfileFrame}
                  isVerified={profile?.isVerified ?? false}
                  isCreatorOfMonth={profile?.isCreatorOfMonth ?? false}
                  profileColor={profile?.profileColor}
                  size="lg"
                />
                
                <div className="flex-1 flex justify-end gap-2 pb-1">
                  {isOwnProfile ? (
                    <Link href="/settings">
                      <Button variant="outline" size="sm" className="rounded-full gap-1.5" data-testid="button-edit-profile">
                        <Settings className="h-4 w-4" />
                        {t.settings?.title || "Settings"}
                      </Button>
                    </Link>
                  ) : user ? (
                    followStatus?.isFollowing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-1.5"
                        onClick={() => unfollowMutation.mutate()}
                        disabled={unfollowMutation.isPending}
                        data-testid="button-unfollow"
                      >
                        <UserMinus className="h-4 w-4" />
                        {t.profile?.unfollow || "Unfollow"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full gap-1.5"
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        data-testid="button-follow"
                      >
                        <UserPlus className="h-4 w-4" />
                        {t.nav.follow}
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
              
              {/* Name and Level */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  {profile?.isVerified && (
                    <BadgeCheck className="h-5 w-5 text-blue-500" data-testid="icon-verified" />
                  )}
                </div>
                {profile?.isCreatorOfMonth && (
                  <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500/50 bg-yellow-500/10 mt-1">
                    <Crown className="h-3 w-3" />
                    {t.profile?.creatorOfMonth || "Creator of the Month"}
                  </Badge>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="outline" className={`gap-1 ${config.color}`}>
                    <LevelIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {currentXp} XP
                  </Badge>
                </div>
                {profile?.bio && (
                  <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
                )}
              </div>

              {/* Social Links */}
              {overview?.socialLinks && overview.socialLinks.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {overview.socialLinks.map((link) => {
                    const Icon = socialIcons[link.platform] || Share2;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover-elevate"
                        data-testid={`social-link-${link.platform}`}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
              
              {/* Stats Row */}
              <div className="flex justify-around py-4 border-t border-b">
                <div className="text-center">
                  <p className="text-xl font-bold">{memesList.length}</p>
                  <p className="text-xs text-muted-foreground">{t.memes?.title || "Memes"}</p>
                </div>
                <FollowersSheet userId={userId} type="followers" count={overview?.followerCount || 0} />
                <FollowersSheet userId={userId} type="following" count={overview?.followingCount || 0} />
                <div className="text-center">
                  <p className="text-xl font-bold">{totalLikes}</p>
                  <p className="text-xs text-muted-foreground">{t.memes?.likes || "Likes"}</p>
                </div>
              </div>

              {/* XP Progress */}
              {nextConfig && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{t.xp.progressTo} {nextConfig.label}</span>
                    <span className="font-medium text-primary">{xpToNext} XP {t.xp.xpNeeded}</span>
                  </div>
                  <Progress value={xpProgress} className="h-1.5" />
                </div>
              )}
              {level === "meme_lord" && (
                <div className="mt-4 text-center">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black gap-1">
                    <Crown className="h-3 w-3" />
                    {t.xp.maxLevel}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="memes" className="w-full">
            <TabsList className={`w-full grid h-11 rounded-xl bg-muted/50 ${isOwnProfile ? "grid-cols-4" : "grid-cols-3"}`}>
              <TabsTrigger value="memes" className="gap-1.5 rounded-lg text-xs" data-testid="tab-memes">
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t.memes?.title || "Memes"}</span>
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger value="favorites" className="gap-1.5 rounded-lg text-xs" data-testid="tab-favorites">
                  <StarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.profile?.favorites || "Favorites"}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="badges" className="gap-1.5 rounded-lg text-xs" data-testid="tab-badges">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">{t.profile?.badges || "Badges"}</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 rounded-lg text-xs" data-testid="tab-activity">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">{t.profile?.activity || "Activity"}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="memes" className="mt-3">
              {memesLoading ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-square" />
                  ))}
                </div>
              ) : memesList.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {memesList.map((meme) => {
                    const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i);
                    return (
                      <div 
                        key={meme.id}
                        className="relative aspect-square overflow-hidden cursor-pointer group bg-muted"
                        onClick={() => setSelectedMeme(meme)}
                        data-testid={`card-user-meme-${meme.id}`}
                      >
                        {isVideo ? (
                          <>
                            <video src={meme.imageUrl} className="w-full h-full object-cover" muted />
                            <Play className="absolute inset-0 m-auto h-8 w-8 text-white drop-shadow-lg" />
                          </>
                        ) : (
                          <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <span className="text-white text-sm flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {meme.likes || 0}
                          </span>
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(meme.id);
                            }}
                            data-testid={`button-delete-meme-${meme.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {isOwnProfile ? t.profile?.noMemesSelf || "You haven't uploaded any memes yet" : t.profile?.noMemesOther || "No memes uploaded yet"}
                    </p>
                    {isOwnProfile && (
                      <Link href="/upload">
                        <Button className="mt-4 rounded-full gap-2" size="sm">
                          <Upload className="h-4 w-4" />
                          {t.upload?.title || "Upload Meme"}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {isOwnProfile && (
              <TabsContent value="favorites" className="mt-3">
                {favoritesLoading ? (
                  <div className="grid grid-cols-3 gap-0.5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))}
                  </div>
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5">
                    {favorites.map((meme) => {
                      const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i);
                      return (
                        <div 
                          key={meme.id}
                          className="relative aspect-square overflow-hidden cursor-pointer group bg-muted"
                          onClick={() => setSelectedMeme(meme)}
                          data-testid={`card-favorite-meme-${meme.id}`}
                        >
                          {isVideo ? (
                            <>
                              <video src={meme.imageUrl} className="w-full h-full object-cover" muted />
                              <Play className="absolute inset-0 m-auto h-8 w-8 text-white drop-shadow-lg" />
                            </>
                          ) : (
                            <img src={meme.imageUrl} alt={meme.title} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <span className="text-white text-sm flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {meme.likes || 0}
                            </span>
                          </div>
                          <StarIcon className="absolute top-1 left-1 h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-md" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <StarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">
                        {t.profile?.noFavorites || "No favorites yet"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.profile?.addFavorites || "Star memes you like to save them here"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            <TabsContent value="badges" className="mt-3">
              {overview?.badges && overview.badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {overview.badges.map((ub) => (
                    <Card key={ub.id} className="overflow-hidden" data-testid={`badge-${ub.badge.id}`}>
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm">{ub.badge.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ub.badge.description}</p>
                        {ub.badge.xpReward && ub.badge.xpReward > 0 && (
                          <Badge variant="secondary" className="mt-2 text-xs gap-0.5">
                            <Zap className="h-3 w-3" />
                            +{ub.badge.xpReward}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">{t.profile?.noBadges || "No badges earned yet"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.profile?.earnBadges || "Keep uploading and engaging to earn badges!"}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              {xpEvents.length > 0 ? (
                <div className="space-y-2">
                  {xpEvents.map((event) => {
                    const sourceInfo = xpSourceLabels[event.reason] || { label: event.reason, icon: Zap, color: "text-primary" };
                    const EventIcon = sourceInfo.icon;
                    return (
                      <Card key={event.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center`}>
                            <EventIcon className={`h-4 w-4 ${sourceInfo.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{sourceInfo.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.createdAt && formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-green-600 text-xs">
                            +{event.amount} XP
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">{t.profile?.noActivity || "No recent activity"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.profile?.startActivity || "Start uploading and engaging to earn XP!"}</p>
                  </CardContent>
                </Card>
              )}

              {/* XP Earning Guide */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {t.xp.howToEarn}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Upload className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">+10 XP</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-muted-foreground">+2 XP</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">+5 XP</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">+5 XP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {selectedMeme && (
        <MemeDetailModal
          meme={selectedMeme}
          isOpen={!!selectedMeme}
          onClose={() => setSelectedMeme(null)}
        />
      )}
    </div>
  );
}
