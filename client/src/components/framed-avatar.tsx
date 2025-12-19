import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Crown } from "lucide-react";
import type { ProfileFrame } from "@shared/schema";

const frameStyles: Record<ProfileFrame, { borderClass: string; glowClass: string; label: string }> = {
  none: { borderClass: "", glowClass: "", label: "None" },
  bronze: { 
    borderClass: "ring-2 ring-amber-700", 
    glowClass: "", 
    label: "Bronze" 
  },
  silver: { 
    borderClass: "ring-2 ring-gray-400", 
    glowClass: "", 
    label: "Silver" 
  },
  gold: { 
    borderClass: "ring-3 ring-yellow-500", 
    glowClass: "shadow-[0_0_10px_rgba(234,179,8,0.5)]", 
    label: "Gold" 
  },
  diamond: { 
    borderClass: "ring-3 ring-cyan-400", 
    glowClass: "shadow-[0_0_15px_rgba(34,211,238,0.6)]", 
    label: "Diamond" 
  },
  rainbow: { 
    borderClass: "ring-3 ring-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-padding", 
    glowClass: "", 
    label: "Rainbow" 
  },
  fire: { 
    borderClass: "ring-3 ring-orange-500", 
    glowClass: "shadow-[0_0_15px_rgba(249,115,22,0.7)]", 
    label: "Fire" 
  },
  ice: { 
    borderClass: "ring-3 ring-blue-300", 
    glowClass: "shadow-[0_0_15px_rgba(147,197,253,0.7)]", 
    label: "Ice" 
  },
  nature: { 
    borderClass: "ring-3 ring-green-500", 
    glowClass: "shadow-[0_0_12px_rgba(34,197,94,0.6)]", 
    label: "Nature" 
  },
  cosmic: { 
    borderClass: "ring-3 ring-purple-500", 
    glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.7)]", 
    label: "Cosmic" 
  },
  legendary: { 
    borderClass: "ring-4 ring-yellow-400", 
    glowClass: "shadow-[0_0_25px_rgba(250,204,21,0.8)] animate-pulse", 
    label: "Legendary" 
  },
};

interface FramedAvatarProps {
  src?: string | null;
  fallback: string;
  frame?: ProfileFrame | string | null;
  isVerified?: boolean;
  isCreatorOfMonth?: boolean;
  profileColor?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
};

const badgeSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
};

export function FramedAvatar({
  src,
  fallback,
  frame = "none",
  isVerified = false,
  isCreatorOfMonth = false,
  profileColor,
  size = "md",
  className = "",
}: FramedAvatarProps) {
  const frameKey = (frame || "none") as ProfileFrame;
  const frameStyle = frameStyles[frameKey] || frameStyles.none;
  
  const customColorStyle = profileColor ? {
    boxShadow: `0 0 12px ${profileColor}40`,
    borderColor: profileColor,
  } : {};

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className={`rounded-full p-0.5 ${frameStyle.borderClass} ${frameStyle.glowClass}`}
        style={profileColor ? customColorStyle : undefined}
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-background`}>
          <AvatarImage src={src || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {isVerified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5" data-testid="badge-verified">
          <BadgeCheck className={`${badgeSizeClasses[size]} text-white`} />
        </div>
      )}
      
      {isCreatorOfMonth && !isVerified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5" data-testid="badge-creator-month">
          <Crown className={`${badgeSizeClasses[size]} text-white`} />
        </div>
      )}
    </div>
  );
}

export function FramePreview({ 
  frame, 
  selected = false,
  onClick,
  locked = false,
}: { 
  frame: ProfileFrame; 
  selected?: boolean;
  onClick?: () => void;
  locked?: boolean;
}) {
  const frameStyle = frameStyles[frame];
  
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
        selected ? "bg-primary/10 ring-2 ring-primary" : "hover-elevate"
      } ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      data-testid={`frame-option-${frame}`}
    >
      <div className={`rounded-full p-0.5 ${frameStyle.borderClass} ${frameStyle.glowClass}`}>
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            {frameStyle.label.charAt(0)}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{frameStyle.label}</span>
      {locked && (
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          Locked
        </Badge>
      )}
    </button>
  );
}

export { frameStyles };
