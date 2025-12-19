import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Save, Loader2, Camera, X } from "lucide-react";
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
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (profile && isOpen) {
      setForm({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile", userId, "overview"] });
      toast({ title: t.toasts?.profileUpdated || "Profile updated!" });
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
      setForm(prev => ({ ...prev, avatarUrl: data.url }));
      toast({ title: "Profile picture uploaded!" });
    } catch {
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
      <DialogContent className="max-w-md mx-4 p-0 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{t.profile.editProfile}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={form.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-muted">
                  {form.displayName?.charAt(0)?.toUpperCase() || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-avatar-file"
              />
            </div>
            {isUploading && (
              <p className="text-sm text-muted-foreground">Uploading...</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t.profile.displayName}</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Your display name"
                className="h-12 rounded-xl"
                data-testid="input-edit-displayname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t.profile.bio}</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
                className="min-h-24 rounded-xl resize-none"
                rows={4}
                data-testid="textarea-edit-bio"
              />
              <p className="text-xs text-muted-foreground text-right">{form.bio.length}/200</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
              data-testid="button-cancel-edit"
            >
              {t.profile.cancel}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 h-12 rounded-xl gap-2"
              data-testid="button-save-profile"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t.profile.save}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
