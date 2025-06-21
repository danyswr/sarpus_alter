import { z } from "zod";

// User schemas
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  username: z.string().min(3, "Username minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  nim: z.string().optional(),
  jurusan: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  role: z.enum(["user", "admin"]).default("user"),
});

// Post schemas
export const createPostSchema = z.object({
  judul: z.string().min(1, "Judul harus diisi"),
  deskripsi: z.string().min(1, "Deskripsi harus diisi"),
  imageUrl: z.string().optional(),
  idUsers: z.string(),
});

export const updatePostSchema = z.object({
  postId: z.string(),
  judul: z.string().min(1, "Judul harus diisi"),
  deskripsi: z.string().min(1, "Deskripsi harus diisi"),
  imageUrl: z.string().optional(),
});

// Like and comment schemas
export const likePostSchema = z.object({
  postId: z.string(),
  userId: z.string(),
});

export const createCommentSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  comment: z.string().min(1, "Komentar harus diisi"),
});

// Image upload schema
export const uploadImageSchema = z.object({
  image: z.string(), // base64 or file path
  fileName: z.string().optional(),
});

// Type exports
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type CreatePostData = z.infer<typeof createPostSchema>;
export type UpdatePostData = z.infer<typeof updatePostSchema>;
export type LikePostData = z.infer<typeof likePostSchema>;
export type CreateCommentData = z.infer<typeof createCommentSchema>;
export type UploadImageData = z.infer<typeof uploadImageSchema>;

// Post type
export interface Post {
  id: string;
  idPostingan: string;
  judul: string;
  deskripsi: string;
  imageUrl?: string;
  idUsers: string;
  username?: string;
  timestamp: string;
  likes?: number;
  comments?: Comment[];
}

// Comment type
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username?: string;
  comment: string;
  timestamp: string;
}

// User type
export interface User {
  idUsers: string;
  username: string;
  email: string;
  role: "user" | "admin";
  nim?: string;
  jurusan?: string;
  gender?: "male" | "female";
}