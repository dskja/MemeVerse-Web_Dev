import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Video, Link } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
  });
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/api/login";
    }
  }, [user, isLoading]);

  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; imageUrl: string }) => {
      return apiRequest("POST", "/api/memes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memes"] });
      toast({ title: t.upload.title + "!" });
      navigate("/profile");
    },
    onError: () => {
      toast({ title: t.common.error, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      toast({ title: t.common.error, variant: "destructive" });
      return;
    }
    uploadMutation.mutate(form);
  };

  const isVideo = form.imageUrl?.match(/\.(mp4|webm|mov)$/i) || mediaType === "video";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <p>{t.common.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t.upload.title}
              </CardTitle>
              <CardDescription>
                {t.upload.supportedFormats}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.upload.memeTitle}</Label>
                  <Input
                    id="title"
                    placeholder={t.upload.titlePlaceholder}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    data-testid="input-meme-title"
                  />
                </div>

                <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as "image" | "video")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="image" className="flex-1 gap-2">
                      <Image className="h-4 w-4" />
                      Image
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex-1 gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="image" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="imageUrl"
                          placeholder="https://example.com/meme.jpg"
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                          className="pl-10"
                          data-testid="input-meme-url"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, GIF, WebP
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="video" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">Video URL</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="videoUrl"
                          placeholder="https://example.com/meme.mp4"
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                          className="pl-10"
                          data-testid="input-video-url"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        MP4, WebM, MOV
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {form.imageUrl && (
                  <div className="rounded-md border overflow-hidden bg-muted">
                    {isVideo ? (
                      <video
                        src={form.imageUrl}
                        controls
                        className="w-full max-h-64 object-contain"
                        onError={(e) => {
                          (e.target as HTMLVideoElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full max-h-64 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-meme"
                >
                  {uploadMutation.isPending ? (
                    t.upload.uploading
                  ) : (
                    <>
                      {isVideo ? <Video className="h-4 w-4" /> : <Image className="h-4 w-4" />}
                      {t.upload.uploadButton}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
