import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { MemeDetailModal } from "@/components/meme-detail-modal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Heart, UserPlus, UserMinus, Edit2, Image, Trash2, Star, Flame, Medal, Crown, 
  Award, Play, Upload, MessageCircle, Trophy, Calendar, Users, Settings, 
  ExternalLink, Share2, Zap, TrendingUp, Target
} from "lucide-react";
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

const levelConfig: Record<string, { icon: typeof Star; color: string; bgGradient: string; label: string; minXp: number; maxXp: number }> = {
  newbie: { icon: Star, color: "text-muted-foreground", bgGradient: "from-gray-400 to-gray-600", label: "Newbie", minXp: 0, maxXp: 100 },
  meme_fan: { icon: Flame, color: "text-blue-500", bgGradient: "from-blue-400 to-blue-600", label: "Meme Fan", minXp: 100, maxXp: 500 },
  meme_master: { icon: Medal, color: "text-purple-500", bgGradient: "from-purple-400 to-purple-600", label: "Meme Master", minXp: 500, maxXp: 2000 },
  meme_lord: { icon: Crown, color: "text-yellow-500", bgGradient: "from-yellow-400 to-yellow-600", label: "Meme Lord", minXp: 2000, maxXp: 10000 },
};

function XpProgressRing({ xp, level }: { xp: number; level: string }) {
  const config = levelConfig[level] || levelConfig.newbie;
  const nextLevelKey = level === "newbie" ? "meme_fan" : level === "meme_fan" ? "meme_master" : level === "meme_master" ? "meme_lord" : null;
  const nextConfig = nextLevelKey ? levelConfig[nextLevelKey] : null;
  
  const xpInLevel = xp - config.minXp;
  const xpNeeded = nextConfig ? nextConfig.minXp - config.minXp : 0;
  const progress = nextConfig ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const LevelIcon = config.icon;
  
  return (
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 transform -rotate-90">
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx="56"
          cy="56"
          r="45"
          stroke="url(#xpGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(326, 80%, 60%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <LevelIcon className={`h-6 w-6 ${config.color}`} />
        <span className="text-lg font-bold">{xp}</span>
        <span className="text-xs text-muted-foreground">XP</span>
      </div>
    </div>
  );
}

function FollowersSheet({ userId, type, count }: { userId: string; type: "followers" | "following"; count: number }) {
  const { data: list = [], isLoading } = useQuery<FollowerWithProfile[]>({
    queryKey: ["/api/profile", userId, type],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${userId}/${type}`);
      return res.json();
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="text-center active:scale-95 transition-transform" data-testid={`button-view-${type}`}>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-sm text-muted-foreground capitalize">{type}</p>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="capitalize">{type}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(70vh-80px)]">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No {type} yet
            </p>
          ) : (
            list.map((item) => {
              const profile = item.profile;
              const targetUserId = type === "followers" ? item.followerId : item.followingId;
              return (
                <Link key={item.id} href={`/profile/${targetUserId}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover-elevate active-elevate-2 cursor-pointer">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(profile?.displayName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{profile?.displayName || "User"}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
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
  
  const [isEditing, setIsEditing] = useState(false);
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
        <main className="pt-20 pb-16 px-4">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
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
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="text-muted-foreground mb-6">Please login to view your profile</p>
            <Button onClick={() => window.location.href = "/api/login"} className="h-12 px-8 rounded-full">
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

  const xpSourceLabels: Record<string, { label: string; icon: typeof Upload; color: string }> = {
    upload: { label: t.xp.uploadMeme, icon: Upload, color: "text-green-500" },
    like_received: { label: t.xp.receiveLike, icon: Heart, color: "text-red-500" },
    comment: { label: t.xp.getComment, icon: MessageCircle, color: "text-blue-500" },
    comment_received: { label: "Comment received", icon: MessageCircle, color: "text-cyan-500" },
    follow_received: { label: t.xp.gainFollower, icon: Users, color: "text-purple-500" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-24">
        <div className="max-w-lg mx-auto px-4 space-y-6">
          
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 ring-4 ring-primary/20 ring-offset-4 ring-offset-background">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/5">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center shadow-lg`}>
                  <LevelIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold">{displayName}</h1>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`gap-1 ${config.color}`}>
                  <LevelIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {profile?.xp || 0} XP
                </Badge>
              </div>
              
              {profile?.bio && (
                <p className="mt-4 text-muted-foreground text-sm max-w-xs">{profile.bio}</p>
              )}
              
              <div className="flex gap-3 mt-5">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-full h-11 px-6 gap-2"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Link href="/settings">
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" data-testid="button-settings">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </Link>
                  </>
                ) : user ? (
                  followStatus?.isFollowing ? (
                    <Button
                      variant="outline"
                      className="rounded-full h-11 px-6 gap-2"
                      onClick={() => unfollowMutation.mutate()}
                      disabled={unfollowMutation.isPending}
                      data-testid="button-unfollow"
                    >
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </Button>
                  ) : (
                    <Button
                      className="rounded-full h-11 px-6 gap-2"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      data-testid="button-follow"
                    >
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </Button>
                  )
                ) : null}
              </div>
            </div>
            
            <div className="flex justify-around mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{memesList.length}</p>
                <p className="text-sm text-muted-foreground">Memes</p>
              </div>
              <FollowersSheet userId={userId} type="followers" count={overview?.followerCount || 0} />
              <FollowersSheet userId={userId} type="following" count={overview?.followingCount || 0} />
            </div>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm p-5">
            <div className="flex items-center gap-4">
              <XpProgressRing xp={profile?.xp || 0} level={level} />
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {t.tabs.xpAndLevel}
                </h3>
                {level !== "meme_lord" ? (
                  <>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.xp.progressTo} {levelConfig[level === "newbie" ? "meme_fan" : level === "meme_fan" ? "meme_master" : "meme_lord"]?.label}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-bold text-primary">
                        {(levelConfig[level === "newbie" ? "meme_fan" : level === "meme_fan" ? "meme_master" : "meme_lord"]?.minXp || 0) - (profile?.xp || 0)}
                      </span> {t.xp.xpNeeded}
                    </p>
                  </>
                ) : (
                  <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                    <Crown className="h-3 w-3 mr-1" />
                    {t.xp.maxLevel}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Tabs defaultValue="memes" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-12 rounded-xl">
              <TabsTrigger value="memes" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Memes</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2 rounded-lg data-[state=active]:shadow-sm">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="memes" className="mt-4">
              {memesLoading ? (
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="aspect-square rounded-md" />
                  ))}
                </div>
              ) : memesList.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {memesList.map((meme) => {
                    const isVideo = meme.imageUrl?.match(/\.(mp4|webm|mov)$/i);
                    return (
                      <div 
                        key={meme.id}
                        className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
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
                            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="text-center py-12 bg-card rounded-2xl border">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "You haven't uploaded any memes yet" : "No memes uploaded yet"}
                  </p>
                  {isOwnProfile && (
                    <Link href="/upload">
                      <Button className="mt-4 rounded-full h-11 px-6 gap-2">
                        <Upload className="h-4 w-4" />
                        Upload your first meme
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges" className="mt-4">
              {overview?.badges && overview.badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {overview.badges.map((ub) => (
                    <div 
                      key={ub.id}
                      className="bg-card rounded-xl border p-4 text-center"
                      data-testid={`badge-${ub.badge.slug}`}
                    >
                      <div className="text-4xl mb-2">
                        <Award className="h-10 w-10 mx-auto text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm">{ub.badge.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ub.badge.description}</p>
                      {ub.badge.xpReward && ub.badge.xpReward > 0 && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          +{ub.badge.xpReward} XP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-2xl border">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No badges earned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Keep uploading and engaging to earn badges!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              {xpEvents.length > 0 ? (
                <div className="space-y-2">
                  {xpEvents.map((event) => {
                    const sourceInfo = xpSourceLabels[event.source] || { label: event.source, icon: Zap, color: "text-primary" };
                    const EventIcon = sourceInfo.icon;
                    return (
                      <div key={event.id} className="bg-card rounded-xl border p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
                          <EventIcon className={`h-5 w-5 ${sourceInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{sourceInfo.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.createdAt && formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-green-600">
                          +{event.amount} XP
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-2xl border">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">Start uploading and engaging to earn XP!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {isEditing && userId && (
        <EditProfileModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          profile={profile || null}
          userId={userId}
        />
      )}

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
