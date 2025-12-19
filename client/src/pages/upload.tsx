import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image, Link } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function UploadPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
  });

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
      toast({ title: "Meme uploaded!" });
      navigate("/profile");
    },
    onError: () => {
      toast({ title: "Failed to upload meme", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <p>Loading...</p>
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
                Upload Meme
              </CardTitle>
              <CardDescription>
                Share your best meme with the MemeVerse community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Give your meme a catchy title..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    data-testid="input-meme-title"
                  />
                </div>

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
                    Paste a direct link to your meme image
                  </p>
                </div>

                {form.imageUrl && (
                  <div className="rounded-md border overflow-hidden">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-contain bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-meme"
                >
                  {uploadMutation.isPending ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Image className="h-4 w-4" />
                      Upload Meme
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
