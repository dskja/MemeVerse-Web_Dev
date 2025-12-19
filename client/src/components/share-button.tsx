import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import { SiInstagram, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareButtonProps {
  memeId: string;
  title: string;
  imageUrl: string;
}

export function ShareButton({ memeId, title, imageUrl }: ShareButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/memes/${memeId}/share`, {});
    },
  });

  const shareUrl = `${window.location.origin}/meme/${memeId}`;
  const shareText = `Check out this meme: ${title}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        shareMutation.mutate();
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      shareMutation.mutate();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, "_blank");
    shareMutation.mutate();
  };

  const handleInstagram = () => {
    toast({ 
      title: "Instagram sharing", 
      description: "Copy the link and paste it in your Instagram story or DM" 
    });
    handleCopyLink();
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  
  if (canShare) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNativeShare}
        className="gap-1"
        data-testid={`button-share-${memeId}`}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-share-${memeId}`}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink} data-testid="menu-copy-link">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsApp} data-testid="menu-share-whatsapp">
          <SiWhatsapp className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleInstagram} data-testid="menu-share-instagram">
          <SiInstagram className="h-4 w-4 mr-2" />
          Instagram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
