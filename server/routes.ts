import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertMemeSchema, insertUserProfileSchema, insertCommentSchema, XP_REWARDS, PROFILE_FRAMES, type ProfileFrame } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // Get all memes
  app.get("/api/memes", async (_req, res) => {
    try {
      const memeList = await storage.getMemes();
      res.json(memeList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memes" });
    }
  });

  // Get single meme
  app.get("/api/memes/:id", async (req, res) => {
    try {
      const meme = await storage.getMeme(req.params.id);
      if (!meme) return res.status(404).json({ error: "Meme not found" });
      res.json(meme);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meme" });
    }
  });

  // Get featured memes
  app.get("/api/memes/featured", async (_req, res) => {
    try {
      const memeList = await storage.getFeaturedMemes();
      res.json(memeList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured memes" });
    }
  });

  // Get user's memes
  app.get("/api/memes/user/:userId", async (req, res) => {
    try {
      const memeList = await storage.getMemesByUser(req.params.userId);
      res.json(memeList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user memes" });
    }
  });

  // Create meme (protected)
  app.post("/api/memes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertMemeSchema.parse({ ...req.body, userId });
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
  app.delete("/api/memes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteMeme(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meme" });
    }
  });

  // Like meme (protected)
  app.post("/api/memes/:id/like", isAuthenticated, async (req: any, res) => {
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
  app.delete("/api/memes/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unlikeMeme(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to unlike meme" });
    }
  });

  // Check if user liked meme
  app.get("/api/memes/:id/like/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hasLiked = await storage.hasLikedMeme(req.params.id, userId);
      res.json({ hasLiked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  // Share meme (increment counter)
  app.post("/api/memes/:id/share", async (req, res) => {
    try {
      await storage.incrementMemeShares(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track share" });
    }
  });

  // Get user profile
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update profile (protected)
  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserProfileSchema.parse({ ...req.body, userId });
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
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Follow user (protected)
  app.post("/api/follow/:userId", isAuthenticated, async (req: any, res) => {
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
  app.delete("/api/follow/:userId", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/follow/:userId/status", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/follow/:userId/counts", async (req, res) => {
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

  // Comments - Get comments for meme
  app.get("/api/memes/:memeId/comments", async (req, res) => {
    try {
      const commentsList = await storage.getCommentsByMeme(req.params.memeId);
      res.json(commentsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Comments - Create comment (protected)
  app.post("/api/memes/:memeId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      const memeId = req.params.memeId;
      const validatedData = insertCommentSchema.parse({ ...req.body, memeId, authorId });
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
  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const authorId = req.user.claims.sub;
      await storage.deleteComment(req.params.id, authorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Notifications - Get user notifications (protected)
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationsList = await storage.getNotifications(userId);
      res.json(notificationsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Notifications - Get unread count (protected)
  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notification count" });
    }
  });

  // Notifications - Mark as read (protected)
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markNotificationRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Notifications - Mark all as read (protected)
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Badges - Get all badges
  app.get("/api/badges", async (_req, res) => {
    try {
      const badgesList = await storage.getBadges();
      res.json(badgesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Badges - Get user badges
  app.get("/api/users/:userId/badges", async (req, res) => {
    try {
      const userBadgesList = await storage.getUserBadges(req.params.userId);
      res.json(userBadgesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user badges" });
    }
  });

  // Gamification summary for current user
  app.get("/api/gamification/summary", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/contests/active", async (_req, res) => {
    try {
      const contest = await storage.getActiveContest();
      res.json(contest || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active contest" });
    }
  });

  // Contests - Get all contests
  app.get("/api/contests", async (_req, res) => {
    try {
      const contestsList = await storage.getContests();
      res.json(contestsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contests" });
    }
  });

  // Contests - Get contest entries
  app.get("/api/contests/:contestId/entries", async (req, res) => {
    try {
      const entries = await storage.getContestEntries(req.params.contestId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contest entries" });
    }
  });

  // Contests - Submit entry (protected)
  app.post("/api/contests/:contestId/entries", isAuthenticated, async (req: any, res) => {
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
  app.delete("/api/contests/entries/:entryId", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/contests/entries/:entryId/vote", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/contests/entries/:entryId/vote/status", isAuthenticated, async (req: any, res) => {
    try {
      const voterId = req.user.claims.sub;
      const hasVoted = await storage.hasVotedForEntry(req.params.entryId, voterId);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ error: "Failed to check vote status" });
    }
  });

  // Profile Preferences - Get
  app.get("/api/profile/:userId/preferences", async (req, res) => {
    try {
      const prefs = await storage.getProfilePreferences(req.params.userId);
      res.json(prefs || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Profile Preferences - Update (protected)
  app.put("/api/profile/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await storage.upsertProfilePreferences({ ...req.body, userId });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Social Links - Get
  app.get("/api/profile/:userId/social-links", async (req, res) => {
    try {
      const links = await storage.getSocialLinks(req.params.userId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social links" });
    }
  });

  // Social Links - Upsert (protected)
  app.post("/api/profile/social-links", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const link = await storage.upsertSocialLink({ ...req.body, userId });
      res.json(link);
    } catch (error) {
      res.status(500).json({ error: "Failed to save social link" });
    }
  });

  // Social Links - Delete (protected)
  app.delete("/api/profile/social-links/:platform", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteSocialLink(userId, req.params.platform);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete social link" });
    }
  });

  // Profile Stats - Get
  app.get("/api/profile/:userId/stats", async (req, res) => {
    try {
      const stats = await storage.getProfileStats(req.params.userId);
      res.json(stats || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile stats" });
    }
  });

  // XP Events - Get recent for user
  app.get("/api/profile/:userId/xp-events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const events = await storage.getXpEvents(req.params.userId, limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch XP events" });
    }
  });

  // Followers with profiles - Get followers list
  app.get("/api/profile/:userId/followers", async (req, res) => {
    try {
      const followersWithProfiles = await storage.getFollowersWithProfiles(req.params.userId);
      res.json(followersWithProfiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  // Following with profiles - Get following list
  app.get("/api/profile/:userId/following", async (req, res) => {
    try {
      const followingWithProfiles = await storage.getFollowingWithProfiles(req.params.userId);
      res.json(followingWithProfiles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // Profile Overview - Aggregated data for profile page
  app.get("/api/profile/:userId/overview", async (req, res) => {
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
  app.post("/api/favorites/:memeId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memeId = req.params.memeId;
      const favorite = await storage.addFavorite(userId, memeId);
      res.json(favorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:memeId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFavorite(userId, req.params.memeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/favorites/:memeId/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const hasFavorited = await storage.hasFavorited(userId, req.params.memeId);
      res.json({ favorited: hasFavorited });
    } catch (error) {
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  // Profile customization endpoints
  app.patch("/api/profile/frame", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/profile/color", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/creator-of-month", async (_req, res) => {
    try {
      const creator = await storage.getCreatorOfMonth();
      if (!creator) {
        return res.json(null);
      }
      const userData = await storage.getUser(creator.userId);
      res.json({
        ...creator,
        username: userData?.username || creator.userId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creator of month" });
    }
  });

  // Verified users
  app.get("/api/verified-users", async (_req, res) => {
    try {
      const users = await storage.getVerifiedUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch verified users" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", isAuthenticated, async (req: any, res) => {
    try {
      const multer = (await import("multer")).default;
      const path = await import("path");
      const fs = await import("fs");
      
      const uploadDir = path.default.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const storage_config = multer.diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          cb(null, uploadDir);
        },
        filename: (_req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = path.default.extname(file.originalname);
          cb(null, file.fieldname + "-" + uniqueSuffix + ext);
        },
      });
      
      const upload = multer({ 
        storage: storage_config,
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_req: any, file: any, cb: any) => {
          const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
          const extname = allowedTypes.test(path.default.extname(file.originalname).toLowerCase());
          const mimetype = allowedTypes.test(file.mimetype);
          if (extname && mimetype) {
            return cb(null, true);
          }
          cb(new Error("Invalid file type"));
        },
      }).single("file");
      
      upload(req, res, (err: any) => {
        if (err) {
          return res.status(400).json({ error: err.message || "Upload failed" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ url: fileUrl });
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  return httpServer;
}
