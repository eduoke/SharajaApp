import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getJournalInsights, getJournalRecommendations } from "./huggingface";
import { insertJournalSchema, insertCircleSchema, insertCircleMemberSchema } from "@shared/schema";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Journal routes
  app.get("/api/journals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const journals = await storage.getAccessibleJournals(req.user.id);
    res.json(journals);
  });

  app.get("/api/journals/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const journals = await storage.getJournalsByUserId(req.user.id);
    res.json(journals);
  });

  app.post("/api/journals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertJournalSchema.parse(req.body);

    // If trying to share with a circle, verify circle exists and user is a member
    if (data.sharedWithCircleId) {
      const isMember = await storage.isCircleMember(req.user.id, data.sharedWithCircleId);
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this circle" });
      }
    }

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

    // Check if user has access to this journal
    if (journal.userId === req.user.id) {
      return res.json(journal); // User owns the journal
    }

    if (journal.isPublic) {
      return res.json(journal); // Journal is public
    }

    if (journal.sharedWithCircleId) {
      const isMember = await storage.isCircleMember(req.user.id, journal.sharedWithCircleId);
      if (isMember) {
        return res.json(journal); // User is member of the circle the journal is shared with
      }
    }

    return res.sendStatus(403);
  });

  app.patch("/api/journals/:id/share", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const journalId = parseInt(req.params.id);
    const { circleId } = req.body;

    const journal = await storage.getJournal(journalId);
    if (!journal) return res.sendStatus(404);
    if (journal.userId !== req.user.id) return res.sendStatus(403);

    if (circleId) {
      const isMember = await storage.isCircleMember(req.user.id, circleId);
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this circle" });
      }
    }

    const updatedJournal = await storage.updateJournalSharing(journalId, circleId);
    res.json(updatedJournal);
  });

  // Circle routes
  app.post("/api/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertCircleSchema.parse(req.body);
    const circle = await storage.createCircle({
      ...data,
      ownerId: req.user.id,
    });

    // Add creator as admin member
    await storage.addCircleMember(circle.id, {
      userId: req.user.id,
      role: 'admin',
    });

    res.status(201).json(circle);
  });

  app.get("/api/circles", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const circles = await storage.getCirclesByUserId(req.user.id);
    res.json(circles);
  });

  app.get("/api/circles/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const circleId = parseInt(req.params.id);

    // Check if user is a member of the circle
    const isMember = await storage.isCircleMember(req.user.id, circleId);
    if (!isMember) return res.sendStatus(403);

    const members = await storage.getCircleMembersByCircleId(circleId);
    res.json(members);
  });

  app.post("/api/circles/:id/members", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const circleId = parseInt(req.params.id);
    const circle = await storage.getCirclesByUserId(req.user.id)
      .then(circles => circles.find(c => c.id === circleId));

    if (!circle) return res.sendStatus(404);
    if (circle.ownerId !== req.user.id) return res.sendStatus(403);

    const { username, role } = insertCircleMemberSchema.parse(req.body);

    // Look up user by username
    const userToAdd = await storage.getUserByUsername(username);
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const member = await storage.addCircleMember(circleId, {
      userId: userToAdd.id,
      role,
    });

    res.status(201).json(member);
  });

  app.delete("/api/circles/:circleId/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const circleId = parseInt(req.params.circleId);
    const circle = await storage.getCirclesByUserId(req.user.id)
      .then(circles => circles.find(c => c.id === circleId));

    if (!circle) return res.sendStatus(404);
    if (circle.ownerId !== req.user.id) return res.sendStatus(403);

    await storage.removeCircleMember(circleId, parseInt(req.params.userId));
    res.sendStatus(204);
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

  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    try {
      const response = await hf.textGeneration({
        model: "gpt2",
        inputs: content,
        parameters: {
          max_new_tokens: 100,
          return_full_text: false,
        }
      });

      res.json({ response: response.generated_text });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}