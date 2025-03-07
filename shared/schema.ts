import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  mood: text("mood").notNull().default("neutral"),
  moodColor: text("mood_color").notNull().default("#808080"), // Default gray for neutral
  isPublic: boolean("is_public").default(false),
  sharedWithCircleId: integer("shared_with_circle_id"), // null means private, unless isPublic is true
  createdAt: timestamp("created_at").defaultNow(),
});

export const circles = pgTable("circles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull(),
  description: text("description"),
});

export const circleMembers = pgTable("circle_members", {
  id: serial("id").primaryKey(),
  circleId: integer("circle_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("member"), // member or admin
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJournalSchema = createInsertSchema(journals).pick({
  title: true,
  content: true,
  category: true,
  mood: true,
  moodColor: true,
  isPublic: true,
  sharedWithCircleId: true,
}).extend({
  mood: z.enum(['joyful', 'happy', 'neutral', 'sad', 'angry']).default('neutral'),
  moodColor: z.string().default('#808080'),
  sharedWithCircleId: z.number().nullable(),
});

export const insertCircleSchema = createInsertSchema(circles).pick({
  name: true,
  description: true,
});

export const insertCircleMemberSchema = createInsertSchema(circleMembers).pick({
  userId: true,
  role: true,
}).extend({
  role: z.enum(['member', 'admin']).default('member'),
  username: z.string(), // Add username field for lookup
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;
export type User = typeof users.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type Circle = typeof circles.$inferSelect;
export type CircleMember = typeof circleMembers.$inferSelect;