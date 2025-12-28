/**
 * EditVerse Storage Models
 * TypeScript type definitions for JSON storage
 */

// User levels
export const USER_LEVELS = ["rookie", "rising_editor", "pro_editor", "master_editor", "icon_editor"] as const;
export type UserLevel = typeof USER_LEVELS[number];

// Profile frame types
export const PROFILE_FRAMES = [
  "none", "bronze", "silver", "gold", "diamond", "rainbow", 
  "fire", "ice", "nature", "cosmic", "legendary"
] as const;
export type ProfileFrame = typeof PROFILE_FRAMES[number];

// XP Rewards for different actions
export const XP_REWARDS = {
  UPLOAD_EDIT: 10,
  RECEIVE_LIKE: 2,
  RECEIVE_COMMENT: 3,
  DAILY_LOGIN: 5,
  PROFILE_COMPLETE: 25,
  FIRST_FOLLOWER: 15,
  CONTEST_WIN: 100,
  CONTEST_PARTICIPATE: 20,
} as const;

// Theme presets
export const THEMES = [
  "dark-cinematic",
  "neon-cyberpunk", 
  "minimalist-light",
  "ocean-blue",
  "sunset-purple",
  "matrix-green"
] as const;
export type Theme = typeof THEMES[number];

// User Model
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Profile Model
export interface UserProfile {
  userId: string;
  bio?: string;
  displayName?: string;
  avatarUrl?: string;
  xp: number;
  level: UserLevel;
  isVerified: boolean;
  profileFrame: ProfileFrame;
  profileColor?: string;
  isCreatorOfMonth: boolean;
  creatorOfMonthDate?: Date;
  theme: Theme;
  createdAt: Date;
}

// Edit (formerly Meme) Model
export interface Edit {
  id: string;
  userId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  musicId?: string;
  movieId?: string;
  likes: number;
  shares: number;
  views: number;
  featured: boolean;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  resolutions: {
    "360p"?: string;
    "480p"?: string;
    "720p"?: string;
    "1080p"?: string;
  };
  duration?: number;
  createdAt: Date;
}

// Edit Like Model
export interface EditLike {
  id: string;
  editId: string;
  userId: string;
  createdAt: Date;
}

// Comment Model
export interface Comment {
  id: string;
  editId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// Follower Model
export interface Follower {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// Notification Model
export interface Notification {
  id: string;
  userId: string;
  type: "like" | "comment" | "follow" | "mention" | "contest" | "badge" | "message";
  content: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

// XP Event Model
export interface XpEvent {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: Date;
}

// Badge Model
export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: "milestone" | "achievement" | "special" | "contest" | "seasonal";
  xpReward: number;
  createdAt: Date;
}

// User Badge Model
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

// Contest Model
export interface Contest {
  id: string;
  title: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  prizes: string[];
  createdAt: Date;
}

// Contest Entry Model
export interface ContestEntry {
  id: string;
  contestId: string;
  editId: string;
  userId: string;
  votes: number;
  createdAt: Date;
}

// Contest Vote Model
export interface ContestVote {
  id: string;
  contestId: string;
  entryId: string;
  userId: string;
  createdAt: Date;
}

// Profile Preferences Model
export interface ProfilePreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  showEmail: boolean;
  showStats: boolean;
  language: string;
  createdAt: Date;
}

// Social Link Model
export interface SocialLink {
  id: string;
  userId: string;
  platform: string;
  url: string;
  createdAt: Date;
}

// Profile Stats Model
export interface ProfileStats {
  userId: string;
  totalEdits: number;
  totalLikes: number;
  totalViews: number;
  totalFollowers: number;
  totalFollowing: number;
  updatedAt: Date;
}

// Edit Favorite Model
export interface EditFavorite {
  id: string;
  userId: string;
  editId: string;
  createdAt: Date;
}

// Music Model
export interface Music {
  id: string;
  title: string;
  artist: string;
  album?: string;
  externalId?: string; // ACRCloud ID
  metadata?: any;
  createdAt: Date;
}

// Movie Model
export interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  type: "movie" | "series";
  releaseDate?: Date;
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  genres: string[];
  franchise?: string;
  createdAt: Date;
}

// Playlist Model
export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  editIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Battle Model
export interface Battle {
  id: string;
  title: string;
  edit1Id: string;
  edit2Id: string;
  user1Id: string;
  user2Id: string;
  votes1: number;
  votes2: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

// Message Model
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

// Database Schema
export interface Database {
  users: User[];
  userProfiles: UserProfile[];
  edits: Edit[];
  editLikes: EditLike[];
  comments: Comment[];
  followers: Follower[];
  notifications: Notification[];
  xpEvents: XpEvent[];
  badges: Badge[];
  userBadges: UserBadge[];
  contests: Contest[];
  contestEntries: ContestEntry[];
  contestVotes: ContestVote[];
  profilePreferences: ProfilePreferences[];
  socialLinks: SocialLink[];
  profileStats: ProfileStats[];
  editFavorites: EditFavorite[];
  music: Music[];
  movies: Movie[];
  playlists: Playlist[];
  battles: Battle[];
  messages: Message[];
}

// Helper to calculate user level based on XP
export function calculateLevel(xp: number): UserLevel {
  if (xp < 100) return "rookie";
  if (xp < 500) return "rising_editor";
  if (xp < 2000) return "pro_editor";
  if (xp < 10000) return "master_editor";
  return "icon_editor";
}
