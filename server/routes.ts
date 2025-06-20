import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  loginSchema,
  registerSchema,
  createPostSchema,
  likePostSchema,
  uploadImageSchema,
  updatePostSchema,
  createCommentSchema
} from "@shared/schema";

// Generate unique IDs
function generateUserId(): string {
  return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generatePostId(): string {
  return `POST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCommentId(): string {
  return `COMMENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Password utility functions
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Session management (simple in-memory for demo)
  const sessions = new Map<string, { userId: string; expires: Date }>();

  function generateSessionToken(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  function createSession(userId: string): string {
    const token = generateSessionToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    sessions.set(token, { userId, expires });
    return token;
  }

  function validateSession(token: string): string | null {
    const session = sessions.get(token);
    if (!session || session.expires < new Date()) {
      if (session) sessions.delete(token);
      return null;
    }
    return session.userId;
  }

  // Middleware to get current user
  async function getCurrentUser(req: any): Promise<any> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    
    const userId = validateSession(token);
    if (!userId) return null;
    
    return await storage.getUserByIdUsers(userId);
  }

  // Test connection
  app.get("/api/test", async (req, res) => {
    try {
      res.json({
        message: "Connection successful",
        timestamp: new Date().toISOString(),
        status: "ok"
      });
    } catch (error) {
      res.status(500).json({ message: "Connection failed" });
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const userId = generateUserId();
      const user = await storage.createUser({
        ...validatedData,
        idUsers: userId,
        password: hashedPassword,
        role: validatedData.role || "user"
      });

      // Create session
      const token = createSession(userId);

      res.json({
        message: "Registrasi berhasil",
        user: {
          idUsers: user.idUsers,
          username: user.username,
          email: user.email,
          role: user.role,
          redirect: "/dashboard"
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat registrasi" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Email atau password salah" });
      }

      // For migrated users, use plain text comparison to match Google Sheets authentication
      // For new users created via register, use bcrypt
      let isValidPassword = false;
      
      if (user.password.startsWith('$2b$')) {
        // Hashed password - use bcrypt
        isValidPassword = await verifyPassword(password, user.password);
      } else {
        // Plain text password - direct comparison for migration compatibility
        isValidPassword = password === user.password;
      }
      
      if (!isValidPassword) {
        return res.status(400).json({ message: "Email atau password salah" });
      }

      // Create session
      const token = createSession(user.idUsers);

      res.json({
        message: "Login berhasil",
        user: {
          idUsers: user.idUsers,
          username: user.username,
          email: user.email,
          role: user.role,
          redirect: "/dashboard"
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat login" });
    }
  });

  // Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil posts" });
    }
  });

  // Create post
  app.post("/api/posts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = createPostSchema.parse(req.body);
      
      const postId = generatePostId();
      const post = await storage.createPost({
        ...validatedData,
        idPostingan: postId,
        idUsers: currentUser.idUsers
      });

      res.json({
        message: "Post berhasil dibuat",
        post
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Create post error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat membuat post" });
    }
  });

  // Update post
  app.put("/api/posts/:postId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { postId } = req.params;
      const validatedData = updatePostSchema.parse({ ...req.body, postId });

      const existingPost = await storage.getPost(postId);
      if (!existingPost) {
        return res.status(404).json({ message: "Post tidak ditemukan" });
      }

      // Check if user owns the post or is admin
      if (existingPost.idUsers !== currentUser.idUsers && currentUser.role !== "admin") {
        return res.status(403).json({ message: "Tidak memiliki izin untuk mengubah post ini" });
      }

      const updatedPost = await storage.updatePost(postId, {
        judul: validatedData.judul,
        deskripsi: validatedData.deskripsi,
        imageUrl: validatedData.imageUrl
      });

      res.json({
        message: "Post berhasil diperbarui",
        post: updatedPost
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Update post error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui post" });
    }
  });

  // Delete post
  app.delete("/api/posts/:postId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { postId } = req.params;
      const existingPost = await storage.getPost(postId);
      
      if (!existingPost) {
        return res.status(404).json({ message: "Post tidak ditemukan" });
      }

      // Check if user owns the post or is admin
      if (existingPost.idUsers !== currentUser.idUsers && currentUser.role !== "admin") {
        return res.status(403).json({ message: "Tidak memiliki izin untuk menghapus post ini" });
      }

      const deleted = await storage.deletePost(postId);
      if (!deleted) {
        return res.status(500).json({ message: "Gagal menghapus post" });
      }

      res.json({ message: "Post berhasil dihapus" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat menghapus post" });
    }
  });

  // Like/dislike post
  app.post("/api/posts/:postId/like", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { postId } = req.params;
      const { type } = likePostSchema.parse({ ...req.body, postId, userId: currentUser.idUsers });

      const updatedPost = await storage.likePost(postId, currentUser.idUsers, type);
      if (!updatedPost) {
        return res.status(404).json({ message: "Post tidak ditemukan" });
      }

      res.json({
        message: `Post berhasil di-${type}`,
        post: updatedPost
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Like post error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat memproses like" });
    }
  });

  // Upload image (simulated)
  app.post("/api/upload", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { imageData, fileName } = uploadImageSchema.parse(req.body);
      
      // In a real app, you would save to cloud storage
      // For now, return a mock URL
      const mockImageUrl = `https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=500&fit=crop`;

      res.json({
        message: "Upload berhasil",
        url: mockImageUrl,
        imageUrl: mockImageUrl
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Upload error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat upload" });
    }
  });

  // Get current user profile
  app.get("/api/profile", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userPosts = await storage.getPostsByUser(currentUser.idUsers);

      res.json({
        user: {
          idUsers: currentUser.idUsers,
          username: currentUser.username,
          email: currentUser.email,
          nim: currentUser.nim,
          jurusan: currentUser.jurusan,
          role: currentUser.role
        },
        posts: userPosts
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil profil" });
    }
  });

  // Update user profile
  app.put("/api/profile", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { username, nim, jurusan } = req.body;
      
      const updatedUser = await storage.updateUser(currentUser.idUsers, {
        username,
        nim,
        jurusan
      });

      res.json({
        message: "Profil berhasil diperbarui",
        user: {
          idUsers: updatedUser!.idUsers,
          username: updatedUser!.username,
          email: updatedUser!.email,
          nim: updatedUser!.nim,
          jurusan: updatedUser!.jurusan,
          role: updatedUser!.role
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui profil" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const allPosts = await storage.getAllPosts();
      const totalUsers = 1; // Simple count for demo
      const totalPosts = allPosts.length;
      const totalLikes = allPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
      const totalDislikes = allPosts.reduce((sum, post) => sum + (post.dislikeCount || 0), 0);

      res.json({
        totalUsers,
        totalPosts,
        totalLikes,
        totalDislikes,
        recentPosts: allPosts.slice(0, 10)
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil statistik" });
    }
  });

  // Comments endpoints
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getCommentsByPost(postId);
      res.json({ comments });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil komentar" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { postId } = req.params;
      const { comment } = createCommentSchema.parse(req.body);
      
      const commentId = generateCommentId();
      const newComment = await storage.createComment({
        idComment: commentId,
        idPostingan: postId,
        idUsers: currentUser.idUsers,
        comment
      });

      res.json({
        message: "Komentar berhasil dibuat",
        comment: newComment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat membuat komentar" });
    }
  });

  app.delete("/api/comments/:commentId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { commentId } = req.params;
      const deleted = await storage.deleteComment(commentId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Komentar tidak ditemukan" });
      }

      res.json({ message: "Komentar berhasil dihapus" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat menghapus komentar" });
    }
  });

  // User endpoints
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUserByIdUsers(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      const userPosts = await storage.getPostsByUser(userId);
      
      res.json({
        user: {
          idUsers: user.idUsers,
          username: user.username,
          email: user.email,
          role: user.role,
          nim: user.nim,
          jurusan: user.jurusan,
          bio: user.bio,
          location: user.location,
          website: user.website
        },
        posts: userPosts
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil data user" });
    }
  });

  app.put("/api/users/:userId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId } = req.params;
      
      // User can only update their own profile
      if (currentUser.idUsers !== userId) {
        return res.status(403).json({ message: "Tidak memiliki izin untuk mengubah profil ini" });
      }

      const updates = req.body;
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      res.json({
        message: "Profil berhasil diperbarui",
        user: updatedUser
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat memperbarui profil" });
    }
  });

  // Test endpoint
  app.get("/api/test", async (req, res) => {
    res.json({ 
      message: "API is working", 
      timestamp: new Date().toISOString(),
      status: "connected"
    });
  });

  // Logout
  app.post("/api/logout", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        sessions.delete(token);
      }
      res.json({ message: "Logout berhasil" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat logout" });
    }
  });

  return server;
}