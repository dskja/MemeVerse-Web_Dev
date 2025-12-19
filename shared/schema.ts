import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// User levels
export const USER_LEVELS = ["newbie", "meme_fan", "meme_master", "meme_lord"] as const;
export type UserLevel = typeof USER_LEVELS[number];

// User profiles (extends auth user with additional info)
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey(),
  bio: text("bio"),
  displayName: varchar("display_name"),
  avatarUrl: varchar("avatar_url"),
  xp: integer("xp").default(0),
  level: varchar("level").default("newbie"),
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

// Meme likes (for tracking who liked what)
export const memeLikes = pgTable("meme_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memeId: varchar("meme_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueLike: uniqueIndex("unique_meme_like_idx").on(table.memeId, table.userId),
}));

export const insertMemeLikeSchema = createInsertSchema(memeLikes).omit({ id: true, createdAt: true });
export type InsertMemeLike = z.infer<typeof insertMemeLikeSchema>;
export type MemeLike = typeof memeLikes.$inferSelect;

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

// Comments system with replies
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memeId: varchar("meme_id").notNull(),
  authorId: varchar("author_id").notNull(),
  parentCommentId: varchar("parent_comment_id"),
  body: text("body").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  meme: one(memes, {
    fields: [comments.memeId],
    references: [memes.id],
  }),
  author: one(userProfiles, {
    fields: [comments.authorId],
    references: [userProfiles.userId],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
  }),
}));

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, likes: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Notifications
export const NOTIFICATION_TYPES = ["like", "comment", "reply", "follow", "badge", "contest"] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(),
  actorId: varchar("actor_id"),
  entityId: varchar("entity_id"),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, read: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// XP Events for tracking points
export const XP_SOURCES = ["upload", "like_received", "comment", "comment_received", "follow_received"] as const;
export type XpSource = typeof XP_SOURCES[number];

export const xpEvents = pgTable("xp_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  source: varchar("source").notNull(),
  amount: integer("amount").notNull(),
  entityId: varchar("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertXpEventSchema = createInsertSchema(xpEvents).omit({ id: true, createdAt: true });
export type InsertXpEvent = z.infer<typeof insertXpEventSchema>;
export type XpEvent = typeof xpEvents.$inferSelect;

// Badges/Achievements
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(),
  criteria: text("criteria").notNull(),
  xpReward: integer("xp_reward").default(0),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true });
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

// User Badges (awarded)
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  badgeId: varchar("badge_id").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow(),
}, (table) => ({
  uniqueUserBadge: uniqueIndex("unique_user_badge_idx").on(table.userId, table.badgeId),
}));

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, awardedAt: true });
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Contests
export const contests = pgTable("contests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  theme: varchar("theme"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContestSchema = createInsertSchema(contests).omit({ id: true, createdAt: true });
export type InsertContest = z.infer<typeof insertContestSchema>;
export type Contest = typeof contests.$inferSelect;

// Contest Entries
export const contestEntries = pgTable("contest_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: varchar("contest_id").notNull(),
  memeId: varchar("meme_id").notNull(),
  userId: varchar("user_id").notNull(),
  votes: integer("votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEntry: uniqueIndex("unique_contest_entry_idx").on(table.contestId, table.userId),
}));

export const insertContestEntrySchema = createInsertSchema(contestEntries).omit({ id: true, createdAt: true, votes: true });
export type InsertContestEntry = z.infer<typeof insertContestEntrySchema>;
export type ContestEntry = typeof contestEntries.$inferSelect;

// Contest Votes
export const contestVotes = pgTable("contest_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: varchar("entry_id").notNull(),
  voterId: varchar("voter_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueVote: uniqueIndex("unique_contest_vote_idx").on(table.entryId, table.voterId),
}));

export const insertContestVoteSchema = createInsertSchema(contestVotes).omit({ id: true, createdAt: true });
export type InsertContestVote = z.infer<typeof insertContestVoteSchema>;
export type ContestVote = typeof contestVotes.$inferSelect;

// XP thresholds for levels
export const XP_THRESHOLDS: Record<UserLevel, number> = {
  newbie: 0,
  meme_fan: 100,
  meme_master: 500,
  meme_lord: 2000,
};

export function calculateLevel(xp: number): UserLevel {
  if (xp >= XP_THRESHOLDS.meme_lord) return "meme_lord";
  if (xp >= XP_THRESHOLDS.meme_master) return "meme_master";
  if (xp >= XP_THRESHOLDS.meme_fan) return "meme_fan";
  return "newbie";
}

// XP rewards for actions
export const XP_REWARDS = {
  upload: 10,
  like_received: 2,
  comment: 5,
  comment_received: 3,
  follow_received: 5,
};
