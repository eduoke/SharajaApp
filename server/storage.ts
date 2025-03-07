import { users, journals, circles, circleMembers, type User, type InsertUser, type Journal, type InsertJournal, type Circle, type InsertCircle, type CircleMember, type InsertCircleMember } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getJournalsByUserId(userId: number): Promise<Journal[]>;
  getAccessibleJournals(userId: number): Promise<Journal[]>;
  createJournal(journal: InsertJournal & { userId: number }): Promise<Journal>;
  getJournal(id: number): Promise<Journal | undefined>;
  createCircle(circle: InsertCircle & { ownerId: number }): Promise<Circle>;
  getCirclesByUserId(userId: number): Promise<Circle[]>;
  getCircleMembersByCircleId(circleId: number): Promise<CircleMember[]>;
  addCircleMember(circleId: number, member: InsertCircleMember): Promise<CircleMember>;
  removeCircleMember(circleId: number, userId: number): Promise<void>;
  isCircleMember(userId: number, circleId: number): Promise<boolean>;
  updateJournalSharing(journalId: number, sharedWithCircleId: number | null): Promise<Journal>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journals: Map<number, Journal>;
  private circles: Map<number, Circle>;
  private circleMembers: Map<number, CircleMember>;
  sessionStore: session.Store;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.journals = new Map();
    this.circles = new Map();
    this.circleMembers = new Map();
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

  async getAccessibleJournals(userId: number): Promise<Journal[]> {
    const journals = Array.from(this.journals.values());
    const userCircles = Array.from(this.circleMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.circleId);

    return journals.filter(journal => 
      journal.userId === userId || // User owns the journal
      journal.isPublic || // Journal is public
      (journal.sharedWithCircleId && userCircles.includes(journal.sharedWithCircleId)) // Journal is shared with user's circle
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
    const userMemberships = Array.from(this.circleMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.circleId);

    return Array.from(this.circles.values()).filter(
      circle => circle.ownerId === userId || userMemberships.includes(circle.id)
    );
  }

  async getCircleMembersByCircleId(circleId: number): Promise<CircleMember[]> {
    return Array.from(this.circleMembers.values()).filter(
      member => member.circleId === circleId
    );
  }

  async addCircleMember(circleId: number, data: InsertCircleMember): Promise<CircleMember> {
    const id = this.currentId++;
    const member: CircleMember = { ...data, id, circleId };
    this.circleMembers.set(id, member);
    return member;
  }

  async removeCircleMember(circleId: number, userId: number): Promise<void> {
    const memberToRemove = Array.from(this.circleMembers.values()).find(
      member => member.circleId === circleId && member.userId === userId
    );
    if (memberToRemove) {
      this.circleMembers.delete(memberToRemove.id);
    }
  }

  async isCircleMember(userId: number, circleId: number): Promise<boolean> {
    return Array.from(this.circleMembers.values()).some(
      member => member.circleId === circleId && member.userId === userId
    );
  }

  async updateJournalSharing(journalId: number, sharedWithCircleId: number | null): Promise<Journal> {
    const journal = await this.getJournal(journalId);
    if (!journal) throw new Error('Journal not found');

    const updatedJournal: Journal = {
      ...journal,
      sharedWithCircleId
    };
    this.journals.set(journalId, updatedJournal);
    return updatedJournal;
  }
}

export const storage = new MemStorage();