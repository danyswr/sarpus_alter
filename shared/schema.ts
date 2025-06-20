import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Define the data model based on the Google Sheets structure
export const users = {
  idUsers: z.string(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  nim: z.string(),
  jurusan: z.string(),
  gender: z.string().optional(),
  role: z.string().default("user"),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
};

export const posts = {
  idPostingan: z.string(),
  idUsers: z.string(),
  judul: z.string(),
  deskripsi: z.string(),
  imageUrl: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
  likeCount: z.number().default(0),
  dislikeCount: z.number().default(0),
};

export const comments = {
  idComment: z.string(),
  idPostingan: z.string(),
  idUsers: z.string(),
  comment: z.string(),
  timestamp: z.date().default(() => new Date()),
};

export const userInteractions = {
  idPostingan: z.string(),
  idUsers: z.string(),
  interactionType: z.enum(["like", "dislike"]),
  timestamp: z.date().default(() => new Date()),
};

// Create Zod schemas
export const userSchema = z.object(users);
export const postSchema = z.object(posts);
export const commentSchema = z.object(comments);
export const userInteractionSchema = z.object(userInteractions);

// Insert schemas (omit auto-generated fields)
export const insertUserSchema = userSchema.omit({ createdAt: true });
export const insertPostSchema = postSchema.omit({ timestamp: true, likeCount: true, dislikeCount: true });
export const insertCommentSchema = commentSchema.omit({ timestamp: true });
export const insertUserInteractionSchema = userInteractionSchema.omit({ timestamp: true });

// Types
export type User = z.infer<typeof userSchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type UserInteraction = z.infer<typeof userInteractionSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;

// Additional schemas for API validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

export const createPostSchema = insertPostSchema.extend({
  idUsers: z.string(),
});

export const likePostSchema = z.object({
  postId: z.string(),
  type: z.enum(['like', 'dislike']),
  userId: z.string(),
});

export const uploadImageSchema = z.object({
  imageData: z.string(),
  fileName: z.string(),
});

export const updatePostSchema = z.object({
  judul: z.string().optional(),
  deskripsi: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const createCommentSchema = z.object({
  idPostingan: z.string(),
  idUsers: z.string(),
  comment: z.string(),
});