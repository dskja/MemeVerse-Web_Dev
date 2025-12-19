import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all memes
  app.get("/api/memes", async (_req, res) => {
    try {
      const memes = await storage.getMemes();
      res.json(memes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memes" });
    }
  });

  // Get featured memes
  app.get("/api/memes/featured", async (_req, res) => {
    try {
      const memes = await storage.getFeaturedMemes();
      res.json(memes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured memes" });
    }
  });

  // Get memes by category
  app.get("/api/memes/category/:category", async (req, res) => {
    try {
      const memes = await storage.getMemesByCategory(req.params.category);
      res.json(memes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memes by category" });
    }
  });

  // Get all categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Submit contact/meme idea
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to submit contact" });
      }
    }
  });

  return httpServer;
}
