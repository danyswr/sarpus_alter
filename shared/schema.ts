import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  idUsers: text("id_users").notNull().unique(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nim: text("nim"),
  jurusan: text("jurusan"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  idPostingan: text("id_postingan").notNull().unique(),
  idUsers: text("id_users").notNull(),
  judul: text("judul").notNull(),
  deskripsi: text("deskripsi").notNull(),
  imageUrl: text("image_url"),
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  likedBy: text("liked_by").array().default([]),
  dislikedBy: text("disliked_by").array().default([]),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  idComment: text("id_comment").notNull().unique(),
  idPostingan: text("id_postingan").notNull(),
  idUsers: text("id_users").notNull(),
  comment: text("comment").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  nim: true,
  jurusan: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  judul: true,
  deskripsi: true,
  imageUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  comment: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
