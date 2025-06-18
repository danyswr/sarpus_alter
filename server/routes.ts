import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";

// Google Apps Script URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(1),
  nim: z.string().optional(),
  jurusan: z.string().optional(),
  gender: z.string().optional(),
  role: z.string().optional(),
});

const createPostSchema = z.object({
  userId: z.string(),
  judul: z.string().optional(),
  deskripsi: z.string().min(1),
  imageUrl: z.string().optional(),
});

const likePostSchema = z.object({
  postId: z.string(),
  type: z.enum(['like', 'dislike']).optional(),
});

// Helper function to call Google Apps Script
async function callGoogleScript(action: string, data: any = {}) {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Google Script API error:', error);
    throw new Error('Failed to connect to Google Apps Script: ' + error.message);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const result = await callGoogleScript('login', { email, password });
      
      if (result.error) {
        return res.status(401).json({ error: result.error });
      }

      res.json({
        message: result.message || "Login berhasil",
        user: result.user,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed: " + error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      const result = await callGoogleScript('register', userData);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        message: result.message || "Registrasi berhasil",
        user: result.user,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed: " + error.message });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const result = await callGoogleScript('getPosts');
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.posts || []);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts: " + error.message });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = createPostSchema.parse(req.body);
      
      const result = await callGoogleScript('createPost', postData);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        message: result.message || "Postingan berhasil dibuat",
        post: result.post,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post: " + error.message });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = likePostSchema.parse(req.body);
      
      const action = type === 'dislike' ? 'dislikePost' : 'likePost';
      const result = await callGoogleScript(action, { postId: id });
      
      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({
        message: result.message || "Berhasil update like/dislike",
        post: result.post,
        newLikeCount: result.newLikeCount,
        newDislikeCount: result.newDislikeCount,
      });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ error: "Failed to update like: " + error.message });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const result = await callGoogleScript('deletePost', { postId: id, userId });
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: result.message || "Postingan berhasil dihapus" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Failed to delete post: " + error.message });
    }
  });

  // User routes
  app.get("/api/users/:idUsers", async (req, res) => {
    try {
      const { idUsers } = req.params;
      
      const result = await callGoogleScript('getProfile', { userId: idUsers });
      
      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json(result.user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user: " + error.message });
    }
  });

  app.put("/api/users/:idUsers", async (req, res) => {
    try {
      const { idUsers } = req.params;
      const updates = req.body;
      
      const result = await callGoogleScript('updateProfile', { userId: idUsers, ...updates });
      
      if (result.error) {
        return res.status(404).json({ error: result.error });
      }

      res.json({
        message: result.message || "Profile berhasil diupdate",
        user: result.user,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user: " + error.message });
    }
  });

  // Image upload route for Google Drive integration
  app.post("/api/upload", async (req, res) => {
    try {
      const { imageBase64, fileName } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      const result = await callGoogleScript('uploadImage', { imageBase64, fileName });
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json({
        message: result.message || "Image uploaded successfully",
        imageUrl: result.imageUrl,
        fileId: result.fileId,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image: " + error.message });
    }
  });

  // Admin stats route
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const result = await callGoogleScript('getAdminStats');
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json(result.stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats: " + error.message });
    }
  });

  // Test connection route
  app.get("/api/test", async (req, res) => {
    try {
      const result = await callGoogleScript('test');
      res.json(result);
    } catch (error) {
      console.error("Test connection error:", error);
      res.status(500).json({ error: "Failed to connect to Google Apps Script: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
