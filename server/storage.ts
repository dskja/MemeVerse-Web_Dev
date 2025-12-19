import { 
  memes, type Meme, type InsertMeme,
  memeLikes, type MemeLike, type InsertMemeLike,
  userProfiles, type UserProfile, type InsertUserProfile,
  followers, type Follower,
  comments, type Comment, type InsertComment,
  notifications, type Notification, type InsertNotification,
  xpEvents, type XpEvent, type InsertXpEvent,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge,
  contests, type Contest, type InsertContest,
  contestEntries, type ContestEntry, type InsertContestEntry,
  contestVotes, type ContestVote,
  calculateLevel, XP_REWARDS
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Memes
  getMemes(): Promise<Meme[]>;
  getMeme(id: string): Promise<Meme | undefined>;
  getFeaturedMemes(): Promise<Meme[]>;
  getMemesByUser(userId: string): Promise<Meme[]>;
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
  getFollowers(userId: string): Promise<Follower[]>;
  getFollowing(userId: string): Promise<Follower[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  
  // Comments
  getCommentsByMeme(memeId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string, authorId: string): Promise<void>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
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
}

export class DatabaseStorage implements IStorage {
  // Memes
  async getMemes(): Promise<Meme[]> {
    return await db.select().from(memes).orderBy(desc(memes.createdAt));
  }

  async getMeme(id: string): Promise<Meme | undefined> {
    const [meme] = await db.select().from(memes).where(eq(memes.id, id));
    return meme;
  }

  async getFeaturedMemes(): Promise<Meme[]> {
    return await db.select().from(memes).where(eq(memes.featured, true)).orderBy(desc(memes.createdAt));
  }

  async getMemesByUser(userId: string): Promise<Meme[]> {
    return await db.select().from(memes).where(eq(memes.userId, userId)).orderBy(desc(memes.createdAt));
  }

  async createMeme(meme: InsertMeme): Promise<Meme> {
    const [newMeme] = await db.insert(memes).values(meme).returning();
    return newMeme;
  }

  async deleteMeme(id: string, userId: string): Promise<void> {
    await db.delete(memes).where(and(eq(memes.id, id), eq(memes.userId, userId)));
  }

  async incrementMemeShares(id: string): Promise<void> {
    await db.update(memes).set({ shares: sql`${memes.shares} + 1` }).where(eq(memes.id, id));
  }

  // Meme Likes
  async likeMeme(memeId: string, userId: string): Promise<boolean> {
    const existing = await this.hasLikedMeme(memeId, userId);
    if (existing) return false;
    
    await db.insert(memeLikes).values({ memeId, userId });
    await db.update(memes).set({ likes: sql`${memes.likes} + 1` }).where(eq(memes.id, memeId));
    return true;
  }

  async unlikeMeme(memeId: string, userId: string): Promise<void> {
    await db.delete(memeLikes).where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
    await db.update(memes).set({ likes: sql`GREATEST(${memes.likes} - 1, 0)` }).where(eq(memes.id, memeId));
  }

  async hasLikedMeme(memeId: string, userId: string): Promise<boolean> {
    const [result] = await db.select().from(memeLikes).where(
      and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId))
    );
    return !!result;
  }

  // User Profiles
  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [result] = await db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          bio: profile.bio,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      })
      .returning();
    return result;
  }

  async searchUsers(query: string): Promise<UserProfile[]> {
    if (!query || query.length < 2) return [];
    const searchPattern = `%${query}%`;
    return await db.select().from(userProfiles)
      .where(or(
        ilike(userProfiles.displayName, searchPattern),
        ilike(userProfiles.userId, searchPattern)
      ))
      .limit(20);
  }

  async getLeaderboard(limit = 50): Promise<UserProfile[]> {
    return await db.select().from(userProfiles)
      .orderBy(desc(userProfiles.xp))
      .limit(limit);
  }

  async addXp(userId: string, amount: number): Promise<UserProfile> {
    let profile = await this.getProfile(userId);
    if (!profile) {
      profile = await this.upsertProfile({ userId, xp: amount, level: calculateLevel(amount) });
    } else {
      const newXp = (profile.xp || 0) + amount;
      const newLevel = calculateLevel(newXp);
      const [updated] = await db.update(userProfiles)
        .set({ xp: newXp, level: newLevel })
        .where(eq(userProfiles.userId, userId))
        .returning();
      profile = updated;
    }
    return profile;
  }

  // Followers
  async follow(followerId: string, followingId: string): Promise<Follower> {
    const existing = await this.isFollowing(followerId, followingId);
    if (existing) {
      const [current] = await db.select().from(followers).where(
        and(eq(followers.followerId, followerId), eq(followers.followingId, followingId))
      );
      return current;
    }
    const [result] = await db
      .insert(followers)
      .values({ followerId, followingId })
      .returning();
    return result;
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await db.delete(followers).where(
      and(eq(followers.followerId, followerId), eq(followers.followingId, followingId))
    );
  }

  async getFollowers(userId: string): Promise<Follower[]> {
    return await db.select().from(followers).where(eq(followers.followingId, userId));
  }

  async getFollowing(userId: string): Promise<Follower[]> {
    return await db.select().from(followers).where(eq(followers.followerId, userId));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [result] = await db.select().from(followers).where(
      and(eq(followers.followerId, followerId), eq(followers.followingId, followingId))
    );
    return !!result;
  }

  async getFollowerCount(userId: string): Promise<number> {
    const result = await db.select().from(followers).where(eq(followers.followingId, userId));
    return result.length;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const result = await db.select().from(followers).where(eq(followers.followerId, userId));
    return result.length;
  }

  // Comments
  async getCommentsByMeme(memeId: string): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.memeId, memeId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: string, authorId: string): Promise<void> {
    await db.delete(comments).where(and(eq(comments.id, id), eq(comments.authorId, authorId)));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return result.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  // XP Events
  async createXpEvent(event: InsertXpEvent): Promise<XpEvent> {
    const [newEvent] = await db.insert(xpEvents).values(event).returning();
    await this.addXp(event.userId, event.amount);
    return newEvent;
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const userBadgesList = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    const allBadges = await this.getBadges();
    
    return userBadgesList.map(ub => {
      const badge = allBadges.find(b => b.id === ub.badgeId)!;
      return { ...ub, badge };
    });
  }

  async awardBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    try {
      const [result] = await db.insert(userBadges).values({ userId, badgeId }).returning();
      return result;
    } catch {
      return null;
    }
  }

  // Contests
  async getActiveContest(): Promise<Contest | undefined> {
    const now = new Date();
    const [contest] = await db.select().from(contests)
      .where(and(
        eq(contests.active, true),
        sql`${contests.startsAt} <= ${now}`,
        sql`${contests.endsAt} >= ${now}`
      ))
      .orderBy(desc(contests.createdAt))
      .limit(1);
    return contest;
  }

  async getContests(): Promise<Contest[]> {
    return await db.select().from(contests).orderBy(desc(contests.createdAt));
  }

  async createContest(contest: InsertContest): Promise<Contest> {
    const [newContest] = await db.insert(contests).values(contest).returning();
    return newContest;
  }

  async getContestEntries(contestId: string): Promise<ContestEntry[]> {
    return await db.select().from(contestEntries)
      .where(eq(contestEntries.contestId, contestId))
      .orderBy(desc(contestEntries.votes));
  }

  async submitContestEntry(entry: InsertContestEntry): Promise<ContestEntry> {
    const [newEntry] = await db.insert(contestEntries).values(entry).returning();
    return newEntry;
  }

  async deleteContestEntry(entryId: string, userId: string): Promise<boolean> {
    const result = await db.delete(contestEntries).where(
      and(eq(contestEntries.id, entryId), eq(contestEntries.userId, userId))
    ).returning();
    return result.length > 0;
  }

  async voteForEntry(entryId: string, voterId: string): Promise<boolean> {
    const hasVoted = await this.hasVotedForEntry(entryId, voterId);
    if (hasVoted) return false;
    
    await db.insert(contestVotes).values({ entryId, voterId });
    await db.update(contestEntries)
      .set({ votes: sql`${contestEntries.votes} + 1` })
      .where(eq(contestEntries.id, entryId));
    return true;
  }

  async hasVotedForEntry(entryId: string, voterId: string): Promise<boolean> {
    const [result] = await db.select().from(contestVotes).where(
      and(eq(contestVotes.entryId, entryId), eq(contestVotes.voterId, voterId))
    );
    return !!result;
  }
}

export const storage = new DatabaseStorage();
