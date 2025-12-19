import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image, 
  Video, 
  Link, 
  FileUp, 
  Sparkles, 
  X, 
  CheckCircle2,
  Loader2,
  Zap
} from "lucide-react";
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
  const [dragActive, setDragActive] = useState(false);
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
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else {
      setMediaType("image");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <main className="pt-20 pb-16">
        <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-2xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Create Content
            </Badge>
            <h1 className="font-bold text-4xl md:text-5xl mb-4">
              {t.upload.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.upload.supportedFormats}
            </p>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-base font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      {t.upload.memeTitle}
                    </Label>
                    <Input
                      id="title"
                      placeholder={t.upload.titlePlaceholder}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-12 text-base"
                      data-testid="input-meme-title"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Media Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={mediaType === "image" ? "default" : "outline"}
                        className="h-14 gap-3 text-base"
                        onClick={() => setMediaType("image")}
                      >
                        <Image className="h-5 w-5" />
                        {t.upload.image}
                      </Button>
                      <Button
                        type="button"
                        variant={mediaType === "video" ? "default" : "outline"}
                        className="h-14 gap-3 text-base"
                        onClick={() => setMediaType("video")}
                      >
                        <Video className="h-5 w-5" />
                        {t.upload.video}
                      </Button>
                    </div>
                  </div>

                  <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "file" | "url")}>
                    <TabsList className="grid w-full grid-cols-2 h-12">
                      <TabsTrigger value="file" className="gap-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <FileUp className="h-4 w-4" />
                        {t.upload.uploadFile}
                      </TabsTrigger>
                      <TabsTrigger value="url" className="gap-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Link className="h-4 w-4" />
                        {t.upload.orUseUrl}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="file" className="mt-6">
                      <div className="space-y-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept={mediaType === "video" ? "video/*" : "image/*"}
                          className="hidden"
                          data-testid="input-file-upload"
                        />
                        
                        {!selectedFile ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                              dragActive 
                                ? "border-primary bg-primary/5 scale-[1.02]" 
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                            }`}
                          >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                              <FileUp className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-lg font-medium mb-2">
                              {t.upload.dragDrop}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              {mediaType === "video" ? "MP4, WebM, MOV up to 100MB" : "JPG, PNG, GIF, WebP up to 10MB"}
                            </p>
                            <Button type="button" variant="outline" className="gap-2">
                              <Upload className="h-4 w-4" />
                              {t.upload.chooseFile}
                            </Button>
                          </div>
                        ) : (
                          <div className="relative rounded-xl border-2 overflow-hidden bg-muted/30">
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="absolute top-3 right-3 z-10 rounded-full shadow-lg"
                              onClick={clearFile}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            {isVideo ? (
                              <video
                                src={previewUrl}
                                controls
                                className="w-full max-h-80 object-contain"
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full max-h-80 object-contain"
                              />
                            )}
                            <div className="p-4 bg-muted/50 border-t flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="mt-6">
                      <div className="space-y-3">
                        <Label htmlFor="imageUrl" className="text-sm font-medium">
                          {mediaType === "video" ? "Video URL" : "Image URL"}
                        </Label>
                        <div className="relative">
                          <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="imageUrl"
                            placeholder={mediaType === "video" ? "https://example.com/meme.mp4" : "https://example.com/meme.jpg"}
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            className="pl-11 h-12"
                            data-testid="input-meme-url"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mediaType === "video" ? "Supports MP4, WebM, MOV" : "Supports JPG, PNG, GIF, WebP"}
                        </p>
                      </div>

                      {form.imageUrl && (
                        <div className="mt-4 rounded-xl border-2 overflow-hidden bg-muted/30">
                          {isVideo ? (
                            <video
                              src={form.imageUrl}
                              controls
                              className="w-full max-h-80 object-contain"
                              onError={(e) => {
                                (e.target as HTMLVideoElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <img
                              src={form.imageUrl}
                              alt="Preview"
                              className="w-full max-h-80 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 gap-3 text-lg"
                    disabled={uploadMutation.isPending || isUploading}
                    data-testid="button-upload-meme"
                  >
                    {uploadMutation.isPending || isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t.upload.uploading}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        {t.upload.uploadButton}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
