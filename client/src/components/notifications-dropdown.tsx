import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Award, 
  Trophy, 
  Check, 
  CheckCheck,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  Gift,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";

const iconMap: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  like: { icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
  comment: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  reply: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  follow: { icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10" },
  badge: { icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  contest: { icon: Trophy, color: "text-purple-500", bg: "bg-purple-500/10" },
  xp: { icon: Zap, color: "text-primary", bg: "bg-primary/10" },
  levelup: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  achievement: { icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  gift: { icon: Gift, color: "text-pink-500", bg: "bg-pink-500/10" },
  rank: { icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" },
};

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => apiRequest("PATCH", "/api/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadData?.count || 0;
  const locale = language === "de" ? de : enUS;

  if (!user) return null;

  const groupedNotifications = notifications.slice(0, 30).reduce((acc, notification) => {
    const date = new Date(notification.createdAt || Date.now());
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = "Earlier";
    if (date.toDateString() === today.toDateString()) {
      group = language === "de" ? "Heute" : "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = language === "de" ? "Gestern" : "Yesterday";
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      group = language === "de" ? "Diese Woche" : "This Week";
    }

    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold">
                  {language === "de" ? "Mitteilungen" : "Notifications"}
                </span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {unreadCount} {language === "de" ? "neu" : "new"}
                  </Badge>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs gap-1.5 h-8"
                disabled={markAllReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {language === "de" ? "Alle gelesen" : "Mark all read"}
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {Object.keys(groupedNotifications).length > 0 ? (
            Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <div className="sticky top-0 bg-muted/50 backdrop-blur-sm px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{group}</span>
                </div>
                {items.map((notification) => {
                  const iconData = iconMap[notification.type] || { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
                  const Icon = iconData.icon;
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 border-b last:border-0 transition-colors hover:bg-muted/50 ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconData.bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${iconData.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${!notification.read ? "font-medium" : ""}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale })}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">
                {language === "de" ? "Keine Mitteilungen" : "No notifications"}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {language === "de" 
                  ? "Wenn du neue Aktivitäten hast, erscheinen sie hier." 
                  : "When you have new activity, it will appear here."}
              </p>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-center text-sm" size="sm">
                {language === "de" ? "Alle Mitteilungen anzeigen" : "View all notifications"}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
