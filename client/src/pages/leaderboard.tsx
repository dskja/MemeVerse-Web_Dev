import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Crown, Flame, Star, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { UserProfile } from "@shared/schema";

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

const levelBgColors: Record<string, string> = {
  newbie: "bg-muted",
  meme_fan: "bg-blue-500/10",
  meme_master: "bg-purple-500/10",
  meme_lord: "bg-yellow-500/10",
};

const levelXpThresholds = [
  { level: "newbie", xp: 0 },
  { level: "meme_fan", xp: 100 },
  { level: "meme_master", xp: 500 },
  { level: "meme_lord", xp: 2000 },
];

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/leaderboard"],
  });
  const { t } = useLanguage();
  const [showLevelGuide, setShowLevelGuide] = useState(false);

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "newbie": return t.levels.newbie;
      case "meme_fan": return t.levels.memeFan;
      case "meme_master": return t.levels.memeMaster;
      case "meme_lord": return t.levels.memeLord;
      default: return t.levels.newbie;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">{t.leaderboard.title}</h1>
            <p className="text-muted-foreground mt-2">{t.leaderboard.levelDescription}</p>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowLevelGuide(!showLevelGuide)}
                data-testid="button-toggle-level-guide"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {t.leaderboard.levelGuide}
                </span>
                {showLevelGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            {showLevelGuide && (
              <CardContent className="pt-0">
                <div className="grid gap-3">
                  {levelXpThresholds.map(({ level, xp }) => {
                    const LevelIcon = levelIcons[level];
                    const levelColor = levelColors[level];
                    const levelBg = levelBgColors[level];
                    return (
                      <div
                        key={level}
                        className={`flex items-center justify-between p-3 rounded-md ${levelBg}`}
                      >
                        <div className="flex items-center gap-3">
                          <LevelIcon className={`h-5 w-5 ${levelColor}`} />
                          <span className={`font-medium ${levelColor}`}>
                            {getLevelLabel(level)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {xp}+ XP
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  +10 XP {t.upload.title} | +2 XP Like | +5 XP {t.memes.comments}
                </p>
              </CardContent>
            )}
          </Card>

          {isLoading ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : leaderboard.length > 0 ? (
            <Card>
              <CardContent className="p-2 sm:p-4">
                <div className="space-y-2">
                  {leaderboard.map((profile, index) => {
                    const rank = index + 1;
                    const LevelIcon = levelIcons[profile.level || "newbie"] || Star;
                    const levelColor = levelColors[profile.level || "newbie"];

                    return (
                      <Link
                        key={profile.userId}
                        href={`/profile/${profile.userId}`}
                        className="flex items-center gap-3 sm:gap-4 p-3 rounded-md hover-elevate"
                        data-testid={`leaderboard-row-${profile.userId}`}
                      >
                        <div className="w-8 text-center font-bold">
                          {rank === 1 ? (
                            <Trophy className="h-6 w-6 text-yellow-500 mx-auto" />
                          ) : rank === 2 ? (
                            <Medal className="h-6 w-6 text-gray-400 mx-auto" />
                          ) : rank === 3 ? (
                            <Award className="h-6 w-6 text-amber-600 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">{rank}</span>
                          )}
                        </div>
                        
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background shadow">
                          <AvatarImage src={profile.avatarUrl || undefined} />
                          <AvatarFallback>
                            {(profile.displayName || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {profile.displayName || "User"}
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${levelColor}`}>
                            <LevelIcon className="h-3 w-3" />
                            {getLevelLabel(profile.level || "newbie")}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-bold text-primary">{profile.xp || 0}</div>
                          <div className="text-xs text-muted-foreground">XP</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
