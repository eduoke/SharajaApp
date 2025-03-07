import { users, journals, circles, type User, type InsertUser, type Journal, type InsertJournal, type Circle, type InsertCircle } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getJournalsByUserId(userId: number): Promise<Journal[]>;
  createJournal(journal: InsertJournal & { userId: number }): Promise<Journal>;
  getJournal(id: number): Promise<Journal | undefined>;
  createCircle(circle: InsertCircle & { ownerId: number }): Promise<Circle>;
  getCirclesByUserId(userId: number): Promise<Circle[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journals: Map<number, Journal>;
  private circles: Map<number, Circle>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.journals = new Map();
    this.circles = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getJournalsByUserId(userId: number): Promise<Journal[]> {
    return Array.from(this.journals.values()).filter(
      (journal) => journal.userId === userId,
    );
  }

  async createJournal(data: InsertJournal & { userId: number }): Promise<Journal> {
    const id = this.currentId++;
    const journal: Journal = {
      ...data,
      id,
      createdAt: new Date(),
      isPublic: data.isPublic ?? false, // Ensure isPublic is never undefined
    };
    this.journals.set(id, journal);
    return journal;
  }

  async getJournal(id: number): Promise<Journal | undefined> {
    return this.journals.get(id);
  }

  async createCircle(data: InsertCircle & { ownerId: number }): Promise<Circle> {
    const id = this.currentId++;
    const circle: Circle = { ...data, id };
    this.circles.set(id, circle);
    return circle;
  }

  async getCirclesByUserId(userId: number): Promise<Circle[]> {
    return Array.from(this.circles.values()).filter(
      (circle) => circle.ownerId === userId,
    );
  }
}

export const storage = new MemStorage();