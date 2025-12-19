import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, X, UserPlus, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { FramedAvatar } from "@/components/framed-avatar";
import type { UserProfile, ProfileFrame } from "@shared/schema";

export function UserSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user } = useAuth();

  const { data: results = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/users/search", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length >= 2,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => apiRequest("POST", `/api/follow/${userId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users/search"] }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-search">
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              data-testid="input-user-search"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-64">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Searching...</p>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((profile) => (
                  <div
                    key={profile.userId}
                    className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                    data-testid={`search-result-${profile.userId}`}
                  >
                    <Link href={`/profile/${profile.userId}`} onClick={() => setOpen(false)}>
                      <FramedAvatar
                        src={profile.avatarUrl}
                        fallback={(profile.displayName || "U").charAt(0)}
                        size="sm"
                        frame={(profile.profileFrame as ProfileFrame) || "default"}
                        profileColor={profile.profileColor || undefined}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${profile.userId}`}
                        onClick={() => setOpen(false)}
                        className="font-medium truncate flex items-center gap-1 hover:underline"
                      >
                        {profile.displayName || "User"}
                        {profile.isVerified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        )}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{profile.bio || "No bio"}</p>
                    </div>
                    {user && user.id !== profile.userId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => followMutation.mutate(profile.userId)}
                        disabled={followMutation.isPending}
                        data-testid={`button-follow-${profile.userId}`}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            ) : (
              <p className="text-center text-muted-foreground py-4">Type at least 2 characters to search</p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
