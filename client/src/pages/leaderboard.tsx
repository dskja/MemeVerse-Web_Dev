import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Crown, Flame, Star, Zap, Image, Heart, TrendingUp, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { FramedAvatar } from "@/components/framed-avatar";
import type { UserProfile, ProfileFrame } from "@shared/schema";

const levelIcons: Record<string, typeof Star> = {
  newbie: Star,
  meme_fan: Flame,
  meme_master: Medal,
  meme_lord: Crown,
};

const levelColors: Record<string, string> = {
  newbie: "text-muted-foreground",
  meme_fan: "text-blue-500",
  meme_master: "text-purple-500",
  meme_lord: "text-yellow-500",
};

const levelBgGradients: Record<string, string> = {
  newbie: "from-gray-400 to-gray-600",
  meme_fan: "from-blue-400 to-blue-600",
  meme_master: "from-purple-400 to-purple-600",
  meme_lord: "from-yellow-400 to-yellow-600",
};

type TimeFilter = "all" | "week" | "month";

export default function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const { data: leaderboard = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/leaderboard", timeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?period=${timeFilter}`, { credentials: "include" });
      return res.json();
    },
  });
  const { t } = useLanguage();

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "newbie": return t.levels.newbie;
      case "meme_fan": return t.levels.memeFan;
      case "meme_master": return t.levels.memeMaster;
      case "meme_lord": return t.levels.memeLord;
      default: return t.levels.newbie;
    }
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-primary to-pink-400 mb-3 shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{t.leaderboard.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.leaderboard.levelDescription}</p>
          </div>

          {/* Time Filter Tabs */}
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="mb-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all" data-testid="tab-all-time">
                <TrendingUp className="h-4 w-4 mr-1.5" />
                {t.leaderboard.allTime || "All Time"}
              </TabsTrigger>
              <TabsTrigger value="month" data-testid="tab-this-month">
                {t.leaderboard.thisMonth || "This Month"}
              </TabsTrigger>
              <TabsTrigger value="week" data-testid="tab-this-week">
                {t.leaderboard.thisWeek || "This Week"}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {/* Podium skeleton */}
              <div className="flex justify-center items-end gap-2 mb-6">
                <Skeleton className="w-24 h-32 rounded-xl" />
                <Skeleton className="w-28 h-40 rounded-xl" />
                <Skeleton className="w-24 h-28 rounded-xl" />
              </div>
              <Card>
                <CardContent className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : leaderboard.length > 0 ? (
            <>
              {/* Top 3 Podium */}
              {top3.length >= 3 && (
                <div className="flex justify-center items-end gap-2 mb-6">
                  {/* 2nd Place */}
                  <PodiumCard profile={top3[1]} rank={2} getLevelLabel={getLevelLabel} />
                  {/* 1st Place */}
                  <PodiumCard profile={top3[0]} rank={1} getLevelLabel={getLevelLabel} />
                  {/* 3rd Place */}
                  <PodiumCard profile={top3[2]} rank={3} getLevelLabel={getLevelLabel} />
                </div>
              )}

              {/* Rest of leaderboard */}
              {rest.length > 0 && (
                <Card>
                  <CardContent className="p-2 sm:p-3">
                    <div className="space-y-1">
                      {rest.map((profile, index) => {
                        const rank = index + 4;
                        const LevelIcon = levelIcons[profile.level || "newbie"] || Star;
                        const levelColor = levelColors[profile.level || "newbie"];

                        return (
                          <Link
                            key={profile.userId}
                            href={`/profile/${profile.userId}`}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover-elevate"
                            data-testid={`leaderboard-row-${profile.userId}`}
                          >
                            <div className="w-7 text-center">
                              <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
                            </div>
                            
                            <FramedAvatar 
                              src={profile.avatarUrl}
                              fallback={(profile.displayName || "U").charAt(0)}
                              size="sm"
                              frame={(profile.profileFrame as ProfileFrame) || "default"}
                              profileColor={profile.profileColor || undefined}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate flex items-center gap-1">
                                {profile.displayName || "User"}
                                {profile.isVerified && (
                                  <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className={`flex items-center gap-1 text-xs ${levelColor}`}>
                                <LevelIcon className="h-3 w-3" />
                                <span>{getLevelLabel(profile.level || "newbie")}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm font-bold text-primary">
                              <Zap className="h-3.5 w-3.5" />
                              {profile.xp || 0}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* XP Guide */}
              <div className="mt-6 p-4 rounded-xl bg-muted/50 border">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  {t.xp?.howToEarn || "How to Earn XP"}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
                    <Image className="h-4 w-4 text-green-500" />
                    <span>+10 XP Upload</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>+2 XP Like</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t.leaderboard.noUsers}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PodiumCard({ profile, rank, getLevelLabel }: { profile: UserProfile; rank: number; getLevelLabel: (level: string) => string }) {
  const LevelIcon = levelIcons[profile.level || "newbie"] || Star;
  const levelColor = levelColors[profile.level || "newbie"];
  
  const isFirst = rank === 1;
  const height = isFirst ? "h-40" : rank === 2 ? "h-32" : "h-28";
  const avatarSizeClass = isFirst ? "lg" : "md";
  const textSize = isFirst ? "text-base" : "text-sm";
  const xpSize = isFirst ? "text-lg" : "text-sm";
  
  const rankIcon = rank === 1 
    ? <Trophy className="h-5 w-5 text-yellow-500" /> 
    : rank === 2 
    ? <Medal className="h-4 w-4 text-gray-400" /> 
    : <Award className="h-4 w-4 text-amber-600" />;

  const rankBg = rank === 1 
    ? "from-yellow-400/20 to-yellow-500/20 border-yellow-500/30" 
    : rank === 2 
    ? "from-gray-300/20 to-gray-400/20 border-gray-400/30" 
    : "from-amber-500/20 to-amber-600/20 border-amber-500/30";

  return (
    <Link href={`/profile/${profile.userId}`} data-testid={`podium-${rank}`}>
      <div className={`${height} w-24 sm:w-28 flex flex-col items-center justify-end p-3 rounded-xl bg-gradient-to-b ${rankBg} border hover-elevate cursor-pointer`}>
        <div className="relative mb-2">
          <FramedAvatar
            src={profile.avatarUrl}
            fallback={(profile.displayName || "U").charAt(0)}
            size={avatarSizeClass as "sm" | "md" | "lg"}
            frame={(profile.profileFrame as ProfileFrame) || "default"}
            profileColor={profile.profileColor || undefined}
          />
          <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 shadow z-10">
            {rankIcon}
          </div>
        </div>
        <div className="flex items-center gap-1 justify-center max-w-full">
          <p className={`${textSize} font-semibold truncate text-center`}>
            {profile.displayName || "User"}
          </p>
          {profile.isVerified && (
            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className={`flex items-center gap-0.5 ${levelColor} text-xs`}>
          <LevelIcon className="h-3 w-3" />
        </div>
        <p className={`${xpSize} font-bold text-primary flex items-center gap-0.5`}>
          <Zap className="h-3 w-3" />
          {profile.xp || 0}
        </p>
      </div>
    </Link>
  );
}
