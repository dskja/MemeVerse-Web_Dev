/**
 * EditVerse Schema - TypeScript Types Only
 * Migrated from Drizzle ORM to plain TypeScript types for JSON storage
 */

// Re-export storage models
export * from "../server/storage/models";

// For backward compatibility, keep these re-exports
export { XP_REWARDS, calculateLevel } from "../server/storage/models";
export type { 
  UserLevel,
  ProfileFrame,
  Theme,
  User,
  UserProfile,
  Edit,
  EditLike,
  Comment,
  Follower,
  Notification,
  XpEvent,
  Badge,
  UserBadge,
  Contest,
  ContestEntry,
  ContestVote,
  ProfilePreferences,
  SocialLink,
  ProfileStats,
  EditFavorite,
  Music,
  Movie,
  Playlist,
  Battle,
  Message,
} from "../server/storage/models";

// Backward compatibility: Meme types (now called Edit)
import type { Edit, EditLike } from "../server/storage/models";
export type Meme = Edit;
export type MemeLike = EditLike;
export type InsertMeme = Omit<Edit, 'id' | 'createdAt'>;
export type InsertMemeLike = Omit<EditLike, 'id' | 'createdAt'>;
