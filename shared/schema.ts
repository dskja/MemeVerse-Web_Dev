import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// User profiles (extends auth user with additional info)
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey(),
  bio: text("bio"),
  displayName: varchar("display_name"),
  avatarUrl: varchar("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Meme schema with user ownership
export const memes = pgTable("memes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const memesRelations = relations(memes, ({ one }) => ({
  profile: one(userProfiles, {
    fields: [memes.userId],
    references: [userProfiles.userId],
  }),
}));

export const insertMemeSchema = createInsertSchema(memes).omit({ id: true, createdAt: true });
export type InsertMeme = z.infer<typeof insertMemeSchema>;
export type Meme = typeof memes.$inferSelect;

// Followers system
export const followers = pgTable("followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull(),
  followingId: varchar("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFollow: uniqueIndex("unique_follow_idx").on(table.followerId, table.followingId),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(userProfiles, {
    fields: [followers.followerId],
    references: [userProfiles.userId],
    relationName: "follower",
  }),
  following: one(userProfiles, {
    fields: [followers.followingId],
    references: [userProfiles.userId],
    relationName: "following",
  }),
}));

export const insertFollowerSchema = createInsertSchema(followers).omit({ id: true, createdAt: true });
export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type Follower = typeof followers.$inferSelect;
