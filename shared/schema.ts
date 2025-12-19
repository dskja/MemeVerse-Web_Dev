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

// Profile frame types based on achievements
export const PROFILE_FRAMES = [
  "none", "bronze", "silver", "gold", "diamond", "rainbow", 
  "fire", "ice", "nature", "cosmic", "legendary"
] as const;
export type ProfileFrame = typeof PROFILE_FRAMES[number];

// User profiles (extends auth user with additional info)
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey(),
  bio: text("bio"),
  displayName: varchar("display_name"),
  avatarUrl: varchar("avatar_url"),
  xp: integer("xp").default(0),
  level: varchar("level").default("newbie"),
  isVerified: boolean("is_verified").default(false),
  profileFrame: varchar("profile_frame").default("none"),
  profileColor: varchar("profile_color"),
  isCreatorOfMonth: boolean("is_creator_of_month").default(false),
  creatorOfMonthDate: timestamp("creator_of_month_date"),
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

// Profile Preferences
export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export type ThemeOption = typeof THEME_OPTIONS[number];

export const LANGUAGE_OPTIONS = ["en", "de"] as const;
export type LanguageOption = typeof LANGUAGE_OPTIONS[number];

export const profilePreferences = pgTable("profile_preferences", {
  userId: varchar("user_id").primaryKey(),
  theme: varchar("theme").default("system"),
  language: varchar("language").default("en"),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  showXpProgress: boolean("show_xp_progress").default(true),
  showBadges: boolean("show_badges").default(true),
  allowDirectMessages: boolean("allow_direct_messages").default(true),
  profilePrivacy: varchar("profile_privacy").default("public"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfilePreferencesSchema = createInsertSchema(profilePreferences).omit({ updatedAt: true });
export type InsertProfilePreferences = z.infer<typeof insertProfilePreferencesSchema>;
export type ProfilePreferences = typeof profilePreferences.$inferSelect;

// Social Links
export const SOCIAL_PLATFORMS = ["twitter", "instagram", "tiktok", "youtube", "discord", "website"] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

export const socialLinks = pgTable("social_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  platform: varchar("platform").notNull(),
  url: varchar("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPlatform: uniqueIndex("unique_user_platform_idx").on(table.userId, table.platform),
}));

export const insertSocialLinkSchema = createInsertSchema(socialLinks).omit({ id: true, createdAt: true });
export type InsertSocialLink = z.infer<typeof insertSocialLinkSchema>;
export type SocialLink = typeof socialLinks.$inferSelect;

// Profile Highlights (pinned memes, achievements showcase)
export const HIGHLIGHT_TYPES = ["pinned_meme", "featured_badge", "contest_win"] as const;
export type HighlightType = typeof HIGHLIGHT_TYPES[number];

export const profileHighlights = pgTable("profile_highlights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(),
  entityId: varchar("entity_id").notNull(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProfileHighlightSchema = createInsertSchema(profileHighlights).omit({ id: true, createdAt: true });
export type InsertProfileHighlight = z.infer<typeof insertProfileHighlightSchema>;
export type ProfileHighlight = typeof profileHighlights.$inferSelect;

// Profile Stats (precomputed for performance)
export const profileStats = pgTable("profile_stats", {
  userId: varchar("user_id").primaryKey(),
  totalLikesReceived: integer("total_likes_received").default(0),
  totalCommentsReceived: integer("total_comments_received").default(0),
  totalViews: integer("total_views").default(0),
  contestsWon: integer("contests_won").default(0),
  contestsEntered: integer("contests_entered").default(0),
  longestStreak: integer("longest_streak").default(0),
  currentStreak: integer("current_streak").default(0),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfileStatsSchema = createInsertSchema(profileStats).omit({ updatedAt: true });
export type InsertProfileStats = z.infer<typeof insertProfileStatsSchema>;
export type ProfileStats = typeof profileStats.$inferSelect;

// Helper function to get next level info
export function getNextLevelInfo(currentLevel: UserLevel): { nextLevel: UserLevel | null; xpNeeded: number } {
  const levels = USER_LEVELS;
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex === levels.length - 1) {
    return { nextLevel: null, xpNeeded: 0 };
  }
  const nextLevel = levels[currentIndex + 1];
  return { nextLevel, xpNeeded: XP_THRESHOLDS[nextLevel] };
}

// Helper function to calculate XP progress percentage
export function getXpProgress(xp: number, level: UserLevel): number {
  const currentThreshold = XP_THRESHOLDS[level];
  const { nextLevel, xpNeeded } = getNextLevelInfo(level);
  if (!nextLevel) return 100;
  const xpInLevel = xp - currentThreshold;
  const xpForLevel = xpNeeded - currentThreshold;
  return Math.min(100, Math.floor((xpInLevel / xpForLevel) * 100));
}

// Meme Favorites (for pinboard)
export const memeFavorites = pgTable("meme_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  memeId: varchar("meme_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFavorite: uniqueIndex("unique_meme_favorite_idx").on(table.userId, table.memeId),
}));

export const insertMemeFavoriteSchema = createInsertSchema(memeFavorites).omit({ id: true, createdAt: true });
export type InsertMemeFavorite = z.infer<typeof insertMemeFavoriteSchema>;
export type MemeFavorite = typeof memeFavorites.$inferSelect;

// Frame unlock requirements
export const FRAME_REQUIREMENTS: Record<ProfileFrame, { type: string; value: number; description: string }> = {
  none: { type: "default", value: 0, description: "Default frame" },
  bronze: { type: "badges", value: 1, description: "Unlock 1 badge" },
  silver: { type: "badges", value: 3, description: "Unlock 3 badges" },
  gold: { type: "badges", value: 5, description: "Unlock 5 badges" },
  diamond: { type: "badges", value: 10, description: "Unlock 10 badges" },
  rainbow: { type: "level", value: 2, description: "Reach Meme Fan level" },
  fire: { type: "likes", value: 100, description: "Receive 100 likes" },
  ice: { type: "memes", value: 20, description: "Upload 20 memes" },
  nature: { type: "followers", value: 50, description: "Get 50 followers" },
  cosmic: { type: "level", value: 4, description: "Reach Meme Lord level" },
  legendary: { type: "contest_wins", value: 1, description: "Win a contest" },
};
