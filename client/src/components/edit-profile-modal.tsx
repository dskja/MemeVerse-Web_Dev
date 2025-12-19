import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  userId: string;
}

export function EditProfileModal({ isOpen, onClose, profile, userId }: EditProfileModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"file" | "url">("file");
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId] });
      toast({ title: t.profile.save + "!" });
      onClose();
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Only images allowed (JPG, PNG, GIF, WebP)", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large (max 10MB)", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setForm({ ...form, avatarUrl: data.url });
      toast({ title: "Profile picture uploaded!" });
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t.profile.editProfile}
          </DialogTitle>
          <DialogDescription>
            {t.profile.displayName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={form.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {form.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <Tabs value={avatarTab} onValueChange={(v) => setAvatarTab(v as "file" | "url")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t.upload.uploadFile}
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-avatar-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload-avatar"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.common.loading}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {t.upload.chooseFile}
                    </>
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="url" className="mt-4">
                <Input
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  data-testid="input-edit-avatar-url"
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t.profile.displayName}</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Your display name"
                data-testid="input-edit-displayname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t.profile.bio}</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell others about yourself..."
                className="resize-none"
                rows={4}
                data-testid="textarea-edit-bio"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t.profile.cancel}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? t.common.loading : t.profile.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
