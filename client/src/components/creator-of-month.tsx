import { useQuery } from "@tanstack/react-query";
import { Crown, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FramedAvatar } from "@/components/framed-avatar";
import type { ProfileFrame } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";

interface CreatorOfMonthData {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  xp: number | null;
  level: string | null;
  isVerified: boolean | null;
  profileFrame: string | null;
  profileColor: string | null;
  isCreatorOfMonth: boolean | null;
  creatorOfMonthDate: string | null;
}

export function CreatorOfMonth() {
  const { t } = useLanguage();
  
  const { data: creator, isLoading } = useQuery<CreatorOfMonthData | null>({
    queryKey: ["/api/creator-of-month"],
    queryFn: async () => {
      const res = await fetch("/api/creator-of-month");
      if (!res.ok) return null;
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 px-4">
        <Card className="max-w-sm mx-auto overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!creator) {
    return null;
  }

  const monthYear = creator.creatorOfMonthDate 
    ? new Date(creator.creatorOfMonthDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <section className="py-8 px-4" data-testid="section-creator-of-month">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-center">
            {t.home?.creatorOfMonth || "Creator of the Month"}
          </h2>
          <Crown className="h-5 w-5 text-yellow-500" />
        </div>
        
        <Link href={`/profile/${creator.userId}`}>
          <Card className="hover-elevate overflow-hidden cursor-pointer bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full blur-md opacity-50 animate-pulse" />
                  <FramedAvatar
                    src={creator.avatarUrl}
                    fallback={creator.displayName?.charAt(0) || creator.username?.charAt(0) || "U"}
                    size="xl"
                    frame={(creator.profileFrame as ProfileFrame) || "default"}
                    profileColor={creator.profileColor || undefined}
                    isVerified={creator.isVerified || false}
                    isCreatorOfMonth={true}
                  />
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold">
                      {creator.displayName || creator.username}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">@{creator.username}</p>
                  
                  <Badge 
                    className="mt-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black gap-1"
                    data-testid="badge-creator-of-month"
                  >
                    <Crown className="h-3 w-3" />
                    {monthYear}
                  </Badge>
                </div>
                
                {creator.bio && (
                  <p className="text-sm text-muted-foreground text-center line-clamp-2 mt-2">
                    {creator.bio}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{creator.xp || 0} XP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}
