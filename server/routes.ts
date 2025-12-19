import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { insertMemeSchema, insertUserProfileSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth first
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

  // Follow user (protected)
  app.post("/api/follow/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }
      
      const follower = await storage.follow(followerId, followingId);
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

  return httpServer;
}
