import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getJournalInsights, getJournalRecommendations } from "./openai";
import { insertJournalSchema, insertCircleSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Journal routes
  app.get("/api/journals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const journals = await storage.getJournalsByUserId(req.user.id);
    res.json(journals);
  });

  app.post("/api/journals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertJournalSchema.parse(req.body);
    const journal = await storage.createJournal({
      ...data,
      userId: req.user.id,
    });
    res.status(201).json(journal);
  });

  app.get("/api/journals/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const journal = await storage.getJournal(parseInt(req.params.id));
    if (!journal) return res.sendStatus(404);
    if (journal.userId !== req.user.id && !journal.isPublic) {
      return res.sendStatus(403);
    }
    res.json(journal);
  });

  // Circle routes
  app.post("/api/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertCircleSchema.parse(req.body);
    const circle = await storage.createCircle({
      ...data,
      ownerId: req.user.id,
    });
    res.status(201).json(circle);
  });

  app.get("/api/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const circles = await storage.getCirclesByUserId(req.user.id);
    res.json(circles);
  });

  // AI routes
  app.post("/api/insights", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });
    
    try {
      const insights = await getJournalInsights(content);
      res.json(insights);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { entries } = req.body;
    if (!entries?.length) return res.status(400).json({ message: "Previous entries are required" });

    try {
      const recommendations = await getJournalRecommendations(entries);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
