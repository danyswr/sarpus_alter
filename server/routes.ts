import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = insertUserSchema.extend({
  role: z.string().optional(),
});

const createPostSchema = insertPostSchema.extend({
  idUsers: z.string(),
});

const likePostSchema = z.object({
  idPostingan: z.string(),
  idUsers: z.string(),
  type: z.enum(['like', 'dislike']),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Email tidak ditemukan" });
      }

      if (user.password !== password) {
        return res.status(401).json({ error: "Password salah" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        message: "Login berhasil",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const idUsers = `USER${Date.now()}`;
      const user = await storage.createUser({
        ...userData,
        idUsers,
        role: userData.email.includes("admin") ? "admin" : "user",
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        message: "Registrasi berhasil",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      
      // Add username to posts
      const postsWithUsernames = await Promise.all(
        posts.map(async (post) => {
          const user = await storage.getUserByIdUsers(post.idUsers);
          return {
            ...post,
            username: user?.username || "Unknown User",
          };
        })
      );

      res.json(postsWithUsernames);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = createPostSchema.parse(req.body);
      
      const idPostingan = `POST${Date.now()}`;
      const post = await storage.createPost({
        ...postData,
        idPostingan,
      });

      res.json({
        message: "Postingan berhasil dibuat",
        post,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const { idUsers, type } = likePostSchema.parse(req.body);
      
      const updatedPost = await storage.likePost(id, idUsers, type);
      if (!updatedPost) {
        return res.status(404).json({ error: "Postingan tidak ditemukan" });
      }

      res.json({
        message: "Berhasil update like/dislike",
        post: updatedPost,
      });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { idUsers } = req.body;
      
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ error: "Postingan tidak ditemukan" });
      }

      const user = await storage.getUserByIdUsers(idUsers);
      if (!user) {
        return res.status(401).json({ error: "User tidak ditemukan" });
      }

      // Check if user owns the post or is admin
      if (post.idUsers !== idUsers && user.role !== "admin") {
        return res.status(403).json({ error: "Tidak memiliki izin untuk menghapus postingan ini" });
      }

      const deleted = await storage.deletePost(id);
      if (!deleted) {
        return res.status(500).json({ error: "Gagal menghapus postingan" });
      }

      res.json({ message: "Postingan berhasil dihapus" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // User routes
  app.get("/api/users/:idUsers", async (req, res) => {
    try {
      const { idUsers } = req.params;
      const user = await storage.getUserByIdUsers(idUsers);
      
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:idUsers", async (req, res) => {
    try {
      const { idUsers } = req.params;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(idUsers, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Profile berhasil diupdate",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Image upload route (placeholder for Google Drive integration)
  app.post("/api/upload", async (req, res) => {
    try {
      // TODO: Implement Google Drive upload
      // For now, return a placeholder URL
      const imageUrl = `https://picsum.photos/600/400?random=${Date.now()}`;
      
      res.json({
        message: "Image uploaded successfully",
        imageUrl,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
