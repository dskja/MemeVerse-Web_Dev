/**
 * EditVerse Storage Interface
 * Wrapper around json-storage to maintain API compatibility
 */

import { jsonStorage } from './storage/json-storage';
import type {
  Edit,
  EditLike,
  UserProfile,
  Follower,
  Comment,
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
  XP_REWARDS,
} from './storage/models';

// For backward compatibility, export types as Meme-related names
export type Meme = Edit;
export type MemeLike = EditLike;
export type InsertMeme = Omit<Edit, 'id' | 'createdAt'>;
export type InsertMemeLike = Omit<EditLike, 'id' | 'createdAt'>;
export type InsertUserProfile = Partial<UserProfile> & { userId: string };
export type InsertComment = Omit<Comment, 'id' | 'createdAt'>;
export type InsertNotification = Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean };
export type InsertXpEvent = Omit<XpEvent, 'id' | 'createdAt'>;
export type InsertBadge = Omit<Badge, 'id' | 'createdAt'>;
export type InsertContest = Omit<Contest, 'id' | 'createdAt'>;
export type InsertContestEntry = Omit<ContestEntry, 'id' | 'createdAt' | 'votes'>;
export type InsertProfilePreferences = ProfilePreferences;
export type InsertSocialLink = Omit<SocialLink, 'id' | 'createdAt'>;
export type InsertProfileStats = ProfileStats;
export type InsertMemeFavorite = Omit<EditFavorite, 'id' | 'createdAt'>;

export { XP_REWARDS };
export type { ProfileFrame } from './storage/models';

export interface IStorage {
  // Memes (Edits)
  getMemes(limit?: number, offset?: number): Promise<Meme[]>;
  getMemesCount(): Promise<number>;
  getMeme(id: string): Promise<Meme | undefined>;
  getFeaturedMemes(): Promise<Meme[]>;
  getMemesByUser(userId: string, limit?: number, offset?: number): Promise<Meme[]>;
  getMemesByUserCount(userId: string): Promise<number>;
  createMeme(meme: InsertMeme): Promise<Meme>;
  deleteMeme(id: string, userId: string): Promise<void>;
  incrementMemeShares(id: string): Promise<void>;
  
  // Meme Likes
  likeMeme(memeId: string, userId: string): Promise<boolean>;
  unlikeMeme(memeId: string, userId: string): Promise<void>;
  hasLikedMeme(memeId: string, userId: string): Promise<boolean>;
  
  // User Profiles
  getProfile(userId: string): Promise<UserProfile | undefined>;
  upsertProfile(profile: InsertUserProfile): Promise<UserProfile>;
  searchUsers(query: string): Promise<UserProfile[]>;
  getLeaderboard(limit?: number): Promise<UserProfile[]>;
  addXp(userId: string, amount: number): Promise<UserProfile>;
  
  // Followers
  follow(followerId: string, followingId: string): Promise<Follower>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string, limit?: number, offset?: number): Promise<Follower[]>;
  getFollowing(userId: string, limit?: number, offset?: number): Promise<Follower[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  
  // Comments
  getCommentsByMeme(memeId: string, limit?: number, offset?: number): Promise<Comment[]>;
  getCommentsByMemeCount(memeId: string): Promise<number>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string, authorId: string): Promise<void>;
  
  // Notifications
  getNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  getNotificationsCount(userId: string): Promise<number>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // XP Events
  createXpEvent(event: InsertXpEvent): Promise<XpEvent>;
  
  // Badges
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  awardBadge(userId: string, badgeId: string): Promise<UserBadge | null>;
  
  // Contests
  getActiveContest(): Promise<Contest | undefined>;
  getContests(): Promise<Contest[]>;
  createContest(contest: InsertContest): Promise<Contest>;
  getContestEntries(contestId: string): Promise<ContestEntry[]>;
  submitContestEntry(entry: InsertContestEntry): Promise<ContestEntry>;
  deleteContestEntry(entryId: string, userId: string): Promise<boolean>;
  voteForEntry(entryId: string, voterId: string): Promise<boolean>;
  hasVotedForEntry(entryId: string, voterId: string): Promise<boolean>;
  
  // Profile Preferences
  getProfilePreferences(userId: string): Promise<ProfilePreferences | undefined>;
  upsertProfilePreferences(prefs: InsertProfilePreferences): Promise<ProfilePreferences>;
  
  // Social Links
  getSocialLinks(userId: string): Promise<SocialLink[]>;
  upsertSocialLink(link: InsertSocialLink): Promise<SocialLink>;
  deleteSocialLink(userId: string, platform: string): Promise<void>;
  
  // Profile Stats
  getProfileStats(userId: string): Promise<ProfileStats | undefined>;
  upsertProfileStats(stats: InsertProfileStats): Promise<ProfileStats>;
  
  // Meme Favorites
  favoriteMeme(userId: string, memeId: string): Promise<void>;
  unfavoriteMeme(userId: string, memeId: string): Promise<void>;
  getFavoriteMemes(userId: string): Promise<Meme[]>;
  isFavoriteMeme(userId: string, memeId: string): Promise<boolean>;
}

// Storage implementation
class JsonStorageAdapter implements IStorage {
  // Memes (Edits)
  async getMemes(limit = 30, offset = 0): Promise<Meme[]> {
    return jsonStorage.getEdits(limit, offset);
  }

  async getMemesCount(): Promise<number> {
    return jsonStorage.getEditsCount();
  }

  async getMeme(id: string): Promise<Meme | undefined> {
    return jsonStorage.getEdit(id);
  }

  async getFeaturedMemes(): Promise<Meme[]> {
    return jsonStorage.getFeaturedEdits();
  }

  async getMemesByUser(userId: string, limit = 30, offset = 0): Promise<Meme[]> {
    return jsonStorage.getEditsByUser(userId, limit, offset);
  }

  async getMemesByUserCount(userId: string): Promise<number> {
    return jsonStorage.getEditsByUserCount(userId);
  }

  async createMeme(meme: InsertMeme): Promise<Meme> {
    return jsonStorage.createEdit(meme as any);
  }

  async deleteMeme(id: string, userId: string): Promise<void> {
    return jsonStorage.deleteEdit(id, userId);
  }

  async incrementMemeShares(id: string): Promise<void> {
    return jsonStorage.incrementEditShares(id);
  }

  // Meme Likes
  async likeMeme(memeId: string, userId: string): Promise<boolean> {
    return jsonStorage.likeEdit(memeId, userId);
  }

  async unlikeMeme(memeId: string, userId: string): Promise<void> {
    return jsonStorage.unlikeEdit(memeId, userId);
  }

  async hasLikedMeme(memeId: string, userId: string): Promise<boolean> {
    return jsonStorage.hasLikedEdit(memeId, userId);
  }

  // User Profiles
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    return jsonStorage.getProfile(userId);
  }

  async upsertProfile(profile: InsertUserProfile): Promise<UserProfile> {
    return jsonStorage.upsertProfile(profile);
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    return jsonStorage.searchUsers(query);
  }

  async getLeaderboard(limit = 10): Promise<UserProfile[]> {
    return jsonStorage.getLeaderboard(limit);
  }

  async addXp(userId: string, amount: number): Promise<UserProfile> {
    return jsonStorage.addXp(userId, amount);
  }

  // Followers
  async follow(followerId: string, followingId: string): Promise<Follower> {
    return jsonStorage.follow(followerId, followingId);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    return jsonStorage.unfollow(followerId, followingId);
  }

  async getFollowers(userId: string, limit = 30, offset = 0): Promise<Follower[]> {
    return jsonStorage.getFollowers(userId, limit, offset);
  }

  async getFollowing(userId: string, limit = 30, offset = 0): Promise<Follower[]> {
    return jsonStorage.getFollowing(userId, limit, offset);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return jsonStorage.isFollowing(followerId, followingId);
  }

  async getFollowerCount(userId: string): Promise<number> {
    const followers = await jsonStorage.getFollowers(userId, 10000, 0);
    return followers.length;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const following = await jsonStorage.getFollowing(userId, 10000, 0);
    return following.length;
  }

  // Comments
  async getCommentsByMeme(memeId: string, limit = 30, offset = 0): Promise<Comment[]> {
    return jsonStorage.getComments(memeId, limit, offset);
  }

  async getCommentsByMemeCount(memeId: string): Promise<number> {
    return jsonStorage.getCommentsCount(memeId);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    return jsonStorage.createComment(comment as any);
  }

  async deleteComment(id: string, authorId: string): Promise<void> {
    return jsonStorage.deleteComment(id, authorId);
  }

  // Notifications
  async getNotifications(userId: string, limit = 30, offset = 0): Promise<Notification[]> {
    return jsonStorage.getNotifications(userId, limit, offset);
  }

  async getNotificationsCount(userId: string): Promise<number> {
    const notifications = await jsonStorage.getNotifications(userId, 10000, 0);
    return notifications.length;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return jsonStorage.getUnreadNotificationsCount(userId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return jsonStorage.createNotification(notification as any);
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    return jsonStorage.markNotificationAsRead(id);
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    return jsonStorage.markAllNotificationsAsRead(userId);
  }

  // XP Events
  async createXpEvent(event: InsertXpEvent): Promise<XpEvent> {
    // XP events are created automatically in addXp, but we'll support this for compatibility
    return {
      id: '',
      userId: event.userId,
      amount: event.amount,
      reason: event.reason,
      createdAt: new Date(),
    };
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return jsonStorage.getAllBadges();
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const userBadges = await jsonStorage.getUserBadges(userId);
    const allBadges = await jsonStorage.getAllBadges();
    
    return userBadges.map(ub => {
      const badge = allBadges.find(b => b.id === ub.badgeId);
      return {
        ...ub,
        badge: badge!,
      };
    }).filter(ub => ub.badge);
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    try {
      return await jsonStorage.awardBadge(userId, badgeId);
    } catch {
      return null;
    }
  }

  // Contests
  async getActiveContest(): Promise<Contest | undefined> {
    const contests = await jsonStorage.getActiveContests();
    return contests[0];
  }

  async getContests(): Promise<Contest[]> {
    return jsonStorage.getActiveContests();
  }

  async createContest(contest: InsertContest): Promise<Contest> {
    return jsonStorage.createContest(contest as any);
  }

  async getContestEntries(contestId: string): Promise<ContestEntry[]> {
    // Not implemented in json-storage yet, return empty array
    return [];
  }

  async submitContestEntry(entry: InsertContestEntry): Promise<ContestEntry> {
    // Not implemented in json-storage yet
    return {
      id: '',
      contestId: entry.contestId,
      editId: entry.editId,
      userId: entry.userId,
      votes: 0,
      createdAt: new Date(),
    };
  }

  async deleteContestEntry(entryId: string, userId: string): Promise<boolean> {
    return false;
  }

  async voteForEntry(entryId: string, voterId: string): Promise<boolean> {
    return false;
  }

  async hasVotedForEntry(entryId: string, voterId: string): Promise<boolean> {
    return false;
  }

  // Profile Preferences
  async getProfilePreferences(userId: string): Promise<ProfilePreferences | undefined> {
    // Not implemented in json-storage yet
    return undefined;
  }

  async upsertProfilePreferences(prefs: InsertProfilePreferences): Promise<ProfilePreferences> {
    return prefs;
  }

  // Social Links
  async getSocialLinks(userId: string): Promise<SocialLink[]> {
    return [];
  }

  async upsertSocialLink(link: InsertSocialLink): Promise<SocialLink> {
    return {
      id: '',
      userId: link.userId,
      platform: link.platform,
      url: link.url,
      createdAt: new Date(),
    };
  }

  async deleteSocialLink(userId: string, platform: string): Promise<void> {
    // Not implemented
  }

  // Profile Stats
  async getProfileStats(userId: string): Promise<ProfileStats | undefined> {
    return undefined;
  }

  async upsertProfileStats(stats: InsertProfileStats): Promise<ProfileStats> {
    return stats;
  }

  // Meme Favorites
  async favoriteMeme(userId: string, memeId: string): Promise<void> {
    // Not implemented
  }

  async unfavoriteMeme(userId: string, memeId: string): Promise<void> {
    // Not implemented
  }

  async getFavoriteMemes(userId: string): Promise<Meme[]> {
    return [];
  }

  async isFavoriteMeme(userId: string, memeId: string): Promise<boolean> {
    return false;
  }
}

export const storage: IStorage = new JsonStorageAdapter();
