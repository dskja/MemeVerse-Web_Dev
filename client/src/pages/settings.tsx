import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, User, Bell, Globe, Shield, Camera, Save, 
  Twitter, Instagram, Youtube, MessageCircle, Link as LinkIcon
} from "lucide-react";
import { SiTiktok, SiDiscord } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserProfile, ProfilePreferences, SocialLink } from "@shared/schema";

const socialPlatforms = [
  { id: "twitter", label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/username" },
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/username" },
  { id: "tiktok", label: "TikTok", icon: SiTiktok, placeholder: "https://tiktok.com/@username" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@username" },
  { id: "discord", label: "Discord", icon: SiDiscord, placeholder: "discord_username" },
  { id: "website", label: "Website", icon: LinkIcon, placeholder: "https://yourwebsite.com" },
];

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });
  
  const [prefsForm, setPrefsForm] = useState({
    emailNotifications: true,
    pushNotifications: true,
    showXpProgress: true,
    showBadges: true,
    allowDirectMessages: true,
  });
  
  const [socialForms, setSocialForms] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${user?.id}`);
      const data = await res.json();
      if (data) {
        setProfileForm({
          displayName: data.displayName || "",
          bio: data.bio || "",
          avatarUrl: data.avatarUrl || "",
        });
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: preferences } = useQuery<ProfilePreferences | null>({
    queryKey: ["/api/profile", user?.id, "preferences"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${user?.id}/preferences`);
      const data = await res.json();
      if (data) {
        setPrefsForm({
          emailNotifications: data.emailNotifications ?? true,
          pushNotifications: data.pushNotifications ?? true,
          showXpProgress: data.showXpProgress ?? true,
          showBadges: data.showBadges ?? true,
          allowDirectMessages: data.allowDirectMessages ?? true,
        });
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: socialLinks = [] } = useQuery<SocialLink[]>({
    queryKey: ["/api/profile", user?.id, "social-links"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${user?.id}/social-links`);
      const data = await res.json();
      const forms: Record<string, string> = {};
      data.forEach((link: SocialLink) => {
        forms[link.platform] = link.url;
      });
      setSocialForms(forms);
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; bio: string; avatarUrl: string }) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", user?.id] });
      toast({ title: t.toasts.profileUpdated || "Profile updated" });
    },
    onError: () => {
      toast({ title: t.toasts.error, variant: "destructive" });
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (data: typeof prefsForm) => {
      return apiRequest("PUT", "/api/profile/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", user?.id, "preferences"] });
      toast({ title: "Preferences saved" });
    },
  });

  const updateSocialLinkMutation = useMutation({
    mutationFn: async ({ platform, url }: { platform: string; url: string }) => {
      if (!url.trim()) {
        return apiRequest("DELETE", `/api/profile/social-links/${platform}`, {});
      }
      return apiRequest("POST", "/api/profile/social-links", { platform, url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", user?.id, "social-links"] });
      toast({ title: "Social link saved" });
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setProfileForm(prev => ({ ...prev, avatarUrl: url }));
      toast({ title: "Avatar uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16 px-4">
          <div className="max-w-lg mx-auto space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-24">
        <div className="max-w-lg mx-auto px-4 space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t.settings?.title || "Settings"}</h1>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                {t.settings?.profile || "Profile"}
              </CardTitle>
              <CardDescription>
                {t.settings?.profileDescription || "Manage your public profile information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileForm.avatarUrl || profile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {(profileForm.displayName || user?.firstName || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                      data-testid="input-avatar-upload"
                    />
                  </label>
                </div>
                {isUploading && <p className="text-sm text-muted-foreground mt-2">Uploading...</p>}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t.settings?.displayName || "Display Name"}</Label>
                  <Input
                    id="displayName"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your display name"
                    className="h-12 rounded-xl"
                    data-testid="input-display-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t.settings?.bio || "Bio"}</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="min-h-24 rounded-xl resize-none"
                    data-testid="input-bio"
                  />
                </div>

                <Button
                  className="w-full h-12 rounded-xl gap-2"
                  onClick={() => updateProfileMutation.mutate(profileForm)}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="h-4 w-4" />
                  {updateProfileMutation.isPending ? "Saving..." : t.settings?.saveProfile || "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="h-5 w-5 text-primary" />
                {t.settings?.socialLinks || "Social Links"}
              </CardTitle>
              <CardDescription>
                {t.settings?.socialLinksDescription || "Connect your social media accounts"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div key={platform.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Input
                      value={socialForms[platform.id] || ""}
                      onChange={(e) => setSocialForms(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      placeholder={platform.placeholder}
                      className="h-11 rounded-xl flex-1"
                      onBlur={() => {
                        const url = socialForms[platform.id] || "";
                        const existingUrl = socialLinks.find(l => l.platform === platform.id)?.url || "";
                        if (url !== existingUrl) {
                          updateSocialLinkMutation.mutate({ platform: platform.id, url });
                        }
                      }}
                      data-testid={`input-social-${platform.id}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                {t.settings?.notifications || "Notifications"}
              </CardTitle>
              <CardDescription>
                {t.settings?.notificationsDescription || "Control your notification preferences"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{t.settings?.pushNotifications || "Push Notifications"}</p>
                  <p className="text-sm text-muted-foreground">{t.settings?.pushNotificationsDescription || "Receive push notifications"}</p>
                </div>
                <Switch
                  checked={prefsForm.pushNotifications}
                  onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, pushNotifications: checked }))}
                  data-testid="switch-push-notifications"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{t.settings?.emailNotifications || "Email Notifications"}</p>
                  <p className="text-sm text-muted-foreground">{t.settings?.emailNotificationsDescription || "Receive email updates"}</p>
                </div>
                <Switch
                  checked={prefsForm.emailNotifications}
                  onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, emailNotifications: checked }))}
                  data-testid="switch-email-notifications"
                />
              </div>

              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => updatePrefsMutation.mutate(prefsForm)}
                disabled={updatePrefsMutation.isPending}
                data-testid="button-save-notifications"
              >
                {updatePrefsMutation.isPending ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                {t.settings?.privacy || "Privacy"}
              </CardTitle>
              <CardDescription>
                {t.settings?.privacyDescription || "Control your privacy settings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{t.settings?.showXpProgress || "Show XP Progress"}</p>
                  <p className="text-sm text-muted-foreground">{t.settings?.showXpProgressDescription || "Display XP on your profile"}</p>
                </div>
                <Switch
                  checked={prefsForm.showXpProgress}
                  onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, showXpProgress: checked }))}
                  data-testid="switch-show-xp"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{t.settings?.showBadges || "Show Badges"}</p>
                  <p className="text-sm text-muted-foreground">{t.settings?.showBadgesDescription || "Display badges on your profile"}</p>
                </div>
                <Switch
                  checked={prefsForm.showBadges}
                  onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, showBadges: checked }))}
                  data-testid="switch-show-badges"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{t.settings?.allowDMs || "Allow Direct Messages"}</p>
                  <p className="text-sm text-muted-foreground">{t.settings?.allowDMsDescription || "Let others message you"}</p>
                </div>
                <Switch
                  checked={prefsForm.allowDirectMessages}
                  onCheckedChange={(checked) => setPrefsForm(prev => ({ ...prev, allowDirectMessages: checked }))}
                  data-testid="switch-allow-dms"
                />
              </div>

              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => updatePrefsMutation.mutate(prefsForm)}
                disabled={updatePrefsMutation.isPending}
                data-testid="button-save-privacy"
              >
                {updatePrefsMutation.isPending ? "Saving..." : "Save Privacy Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                {t.settings?.language || "Language"}
              </CardTitle>
              <CardDescription>
                {t.settings?.languageDescription || "Choose your preferred language"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  className="flex-1 h-12 rounded-xl gap-2"
                  onClick={() => setLanguage("en")}
                  data-testid="button-lang-en"
                >
                  EN
                </Button>
                <Button
                  variant={language === "de" ? "default" : "outline"}
                  className="flex-1 h-12 rounded-xl gap-2"
                  onClick={() => setLanguage("de")}
                  data-testid="button-lang-de"
                >
                  DE
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
