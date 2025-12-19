import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Crown, Flame, Star } from "lucide-react";
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

const levelLabels: Record<string, string> = {
  newbie: "Newbie",
  meme_fan: "Meme Fan",
  meme_master: "Meme Master",
  meme_lord: "Meme Lord",
};

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/leaderboard"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-muted-foreground mt-2">Top creators in the MemeVerse community</p>
          </div>

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
                    const levelLabel = levelLabels[profile.level || "newbie"];

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
                            {levelLabel}
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
                <p className="text-muted-foreground">No users on the leaderboard yet. Be the first!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
