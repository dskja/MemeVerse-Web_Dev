import { 
  memes, type Meme, type InsertMeme,
  userProfiles, type UserProfile, type InsertUserProfile,
  followers, type Follower, type InsertFollower
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Memes
  getMemes(): Promise<Meme[]>;
  getFeaturedMemes(): Promise<Meme[]>;
  getMemesByUser(userId: string): Promise<Meme[]>;
  createMeme(meme: InsertMeme): Promise<Meme>;
  deleteMeme(id: string, userId: string): Promise<void>;
  
  // User Profiles
  getProfile(userId: string): Promise<UserProfile | undefined>;
  upsertProfile(profile: InsertUserProfile): Promise<UserProfile>;
  
  // Followers
  follow(followerId: string, followingId: string): Promise<Follower>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<Follower[]>;
  getFollowing(userId: string): Promise<Follower[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Memes
  async getMemes(): Promise<Meme[]> {
    return await db.select().from(memes).orderBy(desc(memes.createdAt));
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

  // Followers
  async follow(followerId: string, followingId: string): Promise<Follower> {
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
}

export const storage = new DatabaseStorage();
