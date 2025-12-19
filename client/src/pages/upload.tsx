import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Video, Link, FileUp } from "lucide-react";
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
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  const uploadFileToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title) {
      toast({ title: t.common.error, variant: "destructive" });
      return;
    }

    if (uploadMethod === "file" && selectedFile) {
      setIsUploading(true);
      try {
        const uploadedUrl = await uploadFileToServer(selectedFile);
        uploadMutation.mutate({ title: form.title, imageUrl: uploadedUrl });
      } catch {
        toast({ title: t.common.error, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    } else if (uploadMethod === "url" && form.imageUrl) {
      uploadMutation.mutate(form);
    } else {
      toast({ title: t.common.error, variant: "destructive" });
    }
  };

  const isVideo = uploadMethod === "file" 
    ? selectedFile?.type.startsWith("video/") || mediaType === "video"
    : form.imageUrl?.match(/\.(mp4|webm|mov)$/i) || mediaType === "video";

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
                      {t.upload.image}
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex-1 gap-2">
                      <Video className="h-4 w-4" />
                      {t.upload.video}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "file" | "url")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="file" className="flex-1 gap-2">
                      <FileUp className="h-4 w-4" />
                      {t.upload.uploadFile}
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex-1 gap-2">
                      <Link className="h-4 w-4" />
                      {t.upload.orUseUrl}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file" className="mt-4">
                    <div className="space-y-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept={mediaType === "video" ? "video/*" : "image/*"}
                        className="hidden"
                        data-testid="input-file-upload"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          {t.upload.dragDrop}
                        </p>
                        <Button type="button" variant="outline" size="sm">
                          {t.upload.chooseFile}
                        </Button>
                        {selectedFile && (
                          <p className="mt-2 text-sm text-primary">{selectedFile.name}</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="url" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">{mediaType === "video" ? "Video URL" : "Image URL"}</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="imageUrl"
                          placeholder={mediaType === "video" ? "https://example.com/meme.mp4" : "https://example.com/meme.jpg"}
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                          className="pl-10"
                          data-testid="input-meme-url"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mediaType === "video" ? "MP4, WebM, MOV" : "JPG, PNG, GIF, WebP"}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {(previewUrl || form.imageUrl) && (
                  <div className="rounded-md border overflow-hidden bg-muted">
                    {isVideo ? (
                      <video
                        src={uploadMethod === "file" ? previewUrl : form.imageUrl}
                        controls
                        className="w-full max-h-64 object-contain"
                        onError={(e) => {
                          (e.target as HTMLVideoElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <img
                        src={uploadMethod === "file" ? previewUrl : form.imageUrl}
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
                  disabled={uploadMutation.isPending || isUploading}
                  data-testid="button-upload-meme"
                >
                  {uploadMutation.isPending || isUploading ? (
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
