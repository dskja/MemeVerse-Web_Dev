import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, getSession } from "./auth/middleware";
import { z } from "zod";
import { upload } from "./upload-config";
import { readLimiter, apiLimiter, uploadLimiter } from "./middleware/rate-limiter";
import sanitizeHtml from "sanitize-html";
import { parsePaginationParams, createPaginatedResponse } from "./utils/pagination";
import { validateFileType, optimizeImage, isImage } from "./utils/image-optimizer";
import { XP_REWARDS } from "./storage/models";
import fs from "fs";
import path from "path";

// Validation schemas
const insertMemeSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(200),
  imageUrl: z.string(),
  likes: z.number().default(0),
  shares: z.number().default(0),
  featured: z.boolean().default(false),
});

const insertCommentSchema = z.object({
  editId: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(500),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Get all memes with pagination
  app.get("/api/memes", readLimiter, async (req, res) => {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      
      const [memeList, total] = await Promise.all([
        storage.getMemes(limit, offset),
        storage.getMemesCount()
      ]);
      
      const response = createPaginatedResponse(memeList, total, page, limit);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memes" });
    }
  });

  // IMPORTANT: Featured route must come BEFORE :id route to avoid conflicts
  // Get featured memes
  app.get("/api/memes/featured", readLimiter, async (_req, res) => {
    try {
      const memeList = await storage.getFeaturedMemes();
      res.json(memeList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured memes" });
    }
  });

  // Get user's memes with pagination
  app.get("/api/memes/user/:userId", readLimiter, async (req, res) => {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      
      const [memeList, total] = await Promise.all([
        storage.getMemesByUser(req.params.userId, limit, offset),
        storage.getMemesByUserCount(req.params.userId)
      ]);
      
      const response = createPaginatedResponse(memeList, total, page, limit);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user memes" });
    }
  });

  // Get single meme (must come after specific routes)
  app.get("/api/memes/:id", readLimiter, async (req, res) => {
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) return res.status(404).json({ error: "Meme not found" });
      res.json(meme);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meme" });
    }
  });

  // Create meme (protected)
  app.post("/api/memes", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Sanitize text inputs
      const sanitizedBody = {
        ...req.body,
        title: sanitizeHtml(req.body.title, { allowedTags: [], allowedAttributes: {} }),
      };
      
      const validatedData = insertMemeSchema.parse({ ...sanitizedBody, userId });
      const meme = await storage.createMeme(validatedData);
      
      // Award XP for upload
      await storage.createXpEvent({
        userId,
        source: "upload",
        amount: XP_REWARDS.upload,
        entityId: meme.id,
      });
      
      // Check for first upload badge
      const userMemes = await storage.getMemesByUser(userId);
      if (userMemes.length === 1) {
        const badges = await storage.getBadges();
        const firstUploadBadge = badges.find(b => b.slug === "first_upload");
        if (firstUploadBadge) {
          await storage.awardBadge(userId, firstUploadBadge.id);
          await storage.createNotification({
            userId,
            type: "badge",
            message: `You earned the "${firstUploadBadge.name}" badge!`,
            entityId: firstUploadBadge.id,
          });
        }
      }
      
      res.status(201).json(meme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create meme" });
      }
    }
  });

  // Delete meme (protected)
  app.delete("/api/memes/:id", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteMeme(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meme" });
    }
  });

  // Like meme (protected)
  app.post("/api/memes/:id/like", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memeId = req.params.id;
      const liked = await storage.likeMeme(memeId, userId);
      
      if (liked) {
        const meme = await storage.getMeme(memeId);
        if (meme && meme.userId !== userId) {
          // Award XP to meme owner
          await storage.createXpEvent({
            userId: meme.userId,
            source: "like_received",
            amount: XP_REWARDS.like_received,
            entityId: memeId,
          });
          
          // Create notification
          await storage.createNotification({
            userId: meme.userId,
            type: "like",
            actorId: userId,
            entityId: memeId,
            message: "Someone liked your meme!",
          });
          
          // Check for 100 likes badge
          if ((meme.likes || 0) + 1 >= 100) {
            const badges = await storage.getBadges();
            const badge = badges.find(b => b.slug === "hundred_likes");
            if (badge) {
              await storage.awardBadge(meme.userId, badge.id);
            }
          }
        }
      }
      
      res.json({ liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to like meme" });
    }
  });

  // Unlike meme (protected)
  app.delete("/api/memes/:id/like", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unlikeMeme(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to unlike meme" });
    }
  });

  // Check if user liked meme
  app.get("/api/memes/:id/like/status", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hasLiked = await storage.hasLikedMeme(req.params.id, userId);
      res.json({ hasLiked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  // Share meme (increment counter)
  app.post("/api/memes/:id/share", apiLimiter, async (req, res) => {
    try {
      await storage.incrementMemeShares(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track share" });
    }
  });

  // Get user profile
  app.get("/api/profile/:userId", readLimiter, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update profile (protected)
  app.put("/api/profile", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Sanitize text inputs
      const sanitizedBody = {
        ...req.body,
        bio: req.body.bio ? sanitizeHtml(req.body.bio, { allowedTags: [], allowedAttributes: {} }) : req.body.bio,
        displayName: req.body.displayName ? sanitizeHtml(req.body.displayName, { allowedTags: [], allowedAttributes: {} }) : req.body.displayName,
      };
      
      const validatedData = insertUserProfileSchema.parse({ ...sanitizedBody, userId });
      const profile = await storage.upsertProfile(validatedData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  });

  // Search users
  app.get("/api/users/search", readLimiter, async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Follow user (protected)
  app.post("/api/follow/:userId", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      
      const follower = await storage.follow(followerId, followingId);
      
      // Award XP and notify
      await storage.createXpEvent({
        userId: followingId,
        source: "follow_received",
        amount: XP_REWARDS.follow_received,
        entityId: followerId,
      });
      
      await storage.createNotification({
        userId: followingId,
        type: "follow",
        actorId: followerId,
        message: "Someone started following you!",
      });
      
      res.status(201).json(follower);
    } catch (error) {
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  // Unfollow user (protected)
  app.delete("/api/follow/:userId", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      await storage.unfollow(followerId, followingId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  // Check if following
  app.get("/api/follow/:userId/status", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      const isFollowing = await storage.isFollowing(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      res.status(500).json({ error: "Failed to check follow status" });
    }
  });

  // Get follower/following counts
  app.get("/api/follow/:userId/counts", readLimiter, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [followerCount, followingCount] = await Promise.all([
        storage.getFollowerCount(userId),
        storage.getFollowingCount(userId),
      ]);
      res.json({ followerCount, followingCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to get counts" });
    }
  });

  // Comments - Get comments for meme with pagination
  app.get("/api/memes/:memeId/comments", readLimiter, async (req, res) => {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      
      const [commentsList, total] = await Promise.all([
        storage.getCommentsByMeme(req.params.memeId, limit, offset),
        storage.getCommentsByMemeCount(req.params.memeId)
      ]);
      
      const response = createPaginatedResponse(commentsList, total, page, limit);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Comments - Create comment (protected)
  app.post("/api/memes/:memeId/comments", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const memeId = req.params.memeId;
      
      // Sanitize comment content
      const sanitizedBody = {
        ...req.body,
        content: sanitizeHtml(req.body.content, { 
          allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
          allowedAttributes: {
            'a': ['href']
          }
        }),
      };
      
      const validatedData = insertCommentSchema.parse({ ...sanitizedBody, memeId, authorId });
      const comment = await storage.createComment(validatedData);
      
      // Award XP for commenting
      await storage.createXpEvent({
        userId: authorId,
        source: "comment",
        amount: XP_REWARDS.comment,
        entityId: comment.id,
      });
      
      // Notify meme owner
      const meme = await storage.getMeme(memeId);
      if (meme && meme.userId !== authorId) {
        await storage.createXpEvent({
          userId: meme.userId,
          source: "comment_received",
          amount: XP_REWARDS.comment_received,
          entityId: comment.id,
        });
        
        await storage.createNotification({
          userId: meme.userId,
          type: "comment",
          actorId: authorId,
          entityId: memeId,
          message: "Someone commented on your meme!",
        });
      }
      
      // Notify parent comment author for replies
      if (validatedData.parentCommentId) {
        const allComments = await storage.getCommentsByMeme(memeId);
        const parentComment = allComments.find(c => c.id === validatedData.parentCommentId);
        if (parentComment && parentComment.authorId !== authorId) {
          await storage.createNotification({
            userId: parentComment.authorId,
            type: "reply",
            actorId: authorId,
            entityId: comment.id,
            message: "Someone replied to your comment!",
          });
        }
      }
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  // Comments - Delete comment (protected)
  app.delete("/api/comments/:id", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      await storage.deleteComment(req.params.id, authorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Notifications - Get user notifications with pagination (protected)
  app.get("/api/notifications", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { page, limit, offset } = parsePaginationParams(req.query);
      
      const [notificationsList, total] = await Promise.all([
        storage.getNotifications(userId, limit, offset),
        storage.getNotificationsCount(userId)
      ]);
      
      const response = createPaginatedResponse(notificationsList, total, page, limit);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Notifications - Get unread count (protected)
  app.get("/api/notifications/unread-count", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification count" });
    }
  });

  // Notifications - Mark as read (protected)
  app.patch("/api/notifications/:id/read", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markNotificationRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Notifications - Mark all as read (protected)
  app.patch("/api/notifications/read-all", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Leaderboard
  app.get("/api/leaderboard", readLimiter, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Badges - Get all badges
  app.get("/api/badges", readLimiter, async (_req, res) => {
    try {
      const badgesList = await storage.getBadges();
      res.json(badgesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Badges - Get user badges
  app.get("/api/users/:userId/badges", readLimiter, async (req, res) => {
    try {
      const userBadgesList = await storage.getUserBadges(req.params.userId);
      res.json(userBadgesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user badges" });
    }
  });

  // Gamification summary for current user
  app.get("/api/gamification/summary", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [profile, userBadgesList] = await Promise.all([
        storage.getProfile(userId),
        storage.getUserBadges(userId),
      ]);
      res.json({
        xp: profile?.xp || 0,
        level: profile?.level || "newbie",
        badges: userBadgesList,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch gamification summary" });
    }
  });

  // Contests - Get active contest
  app.get("/api/contests/active", readLimiter, async (_req, res) => {
    try {
      const contest = await storage.getActiveContest();
      res.json(contest || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active contest" });
    }
  });

  // Contests - Get all contests
  app.get("/api/contests", readLimiter, async (_req, res) => {
    try {
      const contestsList = await storage.getContests();
      res.json(contestsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contests" });
    }
  });

  // Contests - Get contest entries
  app.get("/api/contests/:contestId/entries", readLimiter, async (req, res) => {
    try {
      const entries = await storage.getContestEntries(req.params.contestId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contest entries" });
    }
  });

  // Contests - Submit entry (protected)
  app.post("/api/contests/:contestId/entries", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contestId = req.params.contestId;
      const { memeId } = req.body;
      
      const entry = await storage.submitContestEntry({ contestId, memeId, userId });
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit entry" });
    }
  });

  // Contests - Delete entry (protected)
  app.delete("/api/contests/entries/:entryId", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryId = req.params.entryId;
      const deleted = await storage.deleteContestEntry(entryId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found or not owned by you" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  // Contests - Vote for entry (protected)
  app.post("/api/contests/entries/:entryId/vote", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const voterId = req.user.claims.sub;
      const entryId = req.params.entryId;
      const voted = await storage.voteForEntry(entryId, voterId);
      res.json({ voted });
    } catch (error) {
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  // Check if user has voted for entry
  app.get("/api/contests/entries/:entryId/vote/status", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const voterId = req.user.claims.sub;
      const hasVoted = await storage.hasVotedForEntry(req.params.entryId, voterId);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ error: "Failed to check vote status" });
    }
  });

  // Profile Preferences - Get
  app.get("/api/profile/:userId/preferences", readLimiter, async (req, res) => {
    try {
      const prefs = await storage.getProfilePreferences(req.params.userId);
      res.json(prefs || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Profile Preferences - Update (protected)
  app.put("/api/profile/preferences", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.upsertProfilePreferences({ ...req.body, userId });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Social Links - Get
  app.get("/api/profile/:userId/social-links", readLimiter, async (req, res) => {
    try {
      const links = await storage.getSocialLinks(req.params.userId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social links" });
    }
  });

  // Social Links - Upsert (protected)
  app.post("/api/profile/social-links", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const link = await storage.upsertSocialLink({ ...req.body, userId });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to save social link" });
    }
  });

  // Social Links - Delete (protected)
  app.delete("/api/profile/social-links/:platform", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteSocialLink(userId, req.params.platform);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete social link" });
    }
  });

  // Profile Stats - Get
  app.get("/api/profile/:userId/stats", readLimiter, async (req, res) => {
    try {
      const stats = await storage.getProfileStats(req.params.userId);
      res.json(stats || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile stats" });
    }
  });

  // XP Events - Get recent for user
  app.get("/api/profile/:userId/xp-events", readLimiter, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const events = await storage.getXpEvents(req.params.userId, limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch XP events" });
    }
  });

  // Followers with profiles - Get followers list with pagination
  app.get("/api/profile/:userId/followers", readLimiter, async (req, res) => {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      
      const [followersList, total] = await Promise.all([
        storage.getFollowers(req.params.userId, limit, offset),
        storage.getFollowerCount(req.params.userId)
      ]);
      
      // Get profiles for followers
      const followersWithProfiles = await Promise.all(
        followersList.map(async (f) => ({
          ...f,
          profile: await storage.getProfile(f.followerId)
        }))
      );
      
      const response = createPaginatedResponse(followersWithProfiles, total, page, limit);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  // Following with profiles - Get following list with pagination
  app.get("/api/profile/:userId/following", readLimiter, async (req, res) => {
    try {
      const { page, limit, offset } = parsePaginationParams(req.query);
      
      const [followingList, total] = await Promise.all([
        storage.getFollowing(req.params.userId, limit, offset),
        storage.getFollowingCount(req.params.userId)
      ]);
      
      // Get profiles for following
      const followingWithProfiles = await Promise.all(
        followingList.map(async (f) => ({
          ...f,
          profile: await storage.getProfile(f.followingId)
        }))
      );
      
      const response = createPaginatedResponse(followingWithProfiles, total, page, limit);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // Profile Overview - Aggregated data for profile page
  app.get("/api/profile/:userId/overview", readLimiter, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [profile, memesList, counts, userBadgesList, socialLinksList, stats] = await Promise.all([
        storage.getProfile(userId),
        storage.getMemesByUser(userId),
        Promise.all([storage.getFollowerCount(userId), storage.getFollowingCount(userId)]),
        storage.getUserBadges(userId),
        storage.getSocialLinks(userId),
        storage.getProfileStats(userId),
      ]);
      
      res.json({
        profile,
        memeCount: memesList.length,
        followerCount: counts[0],
        followingCount: counts[1],
        badges: userBadgesList,
        socialLinks: socialLinksList,
        stats,
        totalLikes: memesList.reduce((sum, m) => sum + (m.likes || 0), 0),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile overview" });
    }
  });

  // Favorites endpoints
  app.post("/api/favorites/:memeId", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memeId = req.params.memeId;
      const favorite = await storage.addFavorite(userId, memeId);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:memeId", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFavorite(userId, req.params.memeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavorites(userId);
      const memes = await Promise.all(
        favorites.map(f => storage.getMeme(f.memeId))
      );
      res.json(memes.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/:memeId/check", isAuthenticated, readLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hasFavorited = await storage.hasFavorited(userId, req.params.memeId);
      res.json({ favorited: hasFavorited });
    } catch (error) {
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  // Profile customization endpoints
  app.patch("/api/profile/frame", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { frame } = req.body;
      if (!PROFILE_FRAMES.includes(frame)) {
        return res.status(400).json({ error: "Invalid frame" });
      }
      const profile = await storage.updateProfileFrame(userId, frame as ProfileFrame);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update frame" });
    }
  });

  app.patch("/api/profile/color", isAuthenticated, apiLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { color } = req.body;
      const profile = await storage.updateProfileColor(userId, color || null);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update color" });
    }
  });

  // Creator of Month
  app.get("/api/creator-of-month", readLimiter, async (_req, res) => {
    try {
      const creator = await storage.getCreatorOfMonth();
      if (!creator) {
        return res.json(null);
      }
      const userData = await storage.getProfile(creator.userId);
      res.json({
        ...creator,
        username: userData?.displayName || userData?.userId || creator.userId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creator of month" });
    }
  });

  // Verified users
  app.get("/api/verified-users", readLimiter, async (_req, res) => {
    try {
      const users = await storage.getVerifiedUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified users" });
    }
  });

  // File upload endpoint with enhanced security and image optimization
  app.post("/api/upload", isAuthenticated, uploadLimiter, upload.single("file"), async (req: any, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      
      // Validate file type using magic numbers (not just extension)
      const fileBuffer = fs.readFileSync(filePath);
      const validation = await validateFileType(fileBuffer);
      
      if (!validation.valid) {
        // Delete invalid file
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: validation.error || "Invalid file type" });
      }

      let finalPath = filePath;
      let thumbnailUrl: string | undefined;

      // Optimize images (not videos)
      if (validation.mimeType && isImage(validation.mimeType)) {
        try {
          // Generate safe filename - req.file.filename is already safe from upload-config
          const safeBasename = path.basename(req.file.filename).replace(/[^a-zA-Z0-9-_.]/g, '');
          const optimizedName = `${path.basename(safeBasename, path.extname(safeBasename))}.webp`;
          const optimizedPath = path.join(path.dirname(filePath), optimizedName);
          
          const result = await optimizeImage(filePath, optimizedPath, true);
          finalPath = result.optimized;
          
          if (result.thumbnail) {
            // Extra safety: ensure we only get the filename, no path components
            const safeThumbnailName = path.basename(result.thumbnail).replace(/[^a-zA-Z0-9-_.]/g, '');
            thumbnailUrl = `/uploads/thumbnails/${safeThumbnailName}`;
          }
        } catch (optimizeError) {
          console.error("Image optimization failed, using original:", optimizeError);
          // Keep original file if optimization fails
        }
      }

      // Ensure we only return the filename without any path components
      const safeFilename = path.basename(finalPath).replace(/[^a-zA-Z0-9-_.]/g, '');
      const fileUrl = `/uploads/${safeFilename}`;
      
      res.json({ 
        url: fileUrl,
        thumbnail: thumbnailUrl,
        mimeType: validation.mimeType
      });
    } catch (error) {
      // Clean up file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  });

  return httpServer;
}
