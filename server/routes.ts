import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { storage } from "./googleSheetsStorage";
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

  // WebSocket Server setup for real-time features
  const wss = new WebSocketServer({ server: server, path: '/ws' });
  
  // Store connected clients with user info
  const connectedClients = new Map<string, { ws: WebSocket; userId: string; userData: any }>();
  const userConnections = new Map<string, string[]>(); // userId -> array of client IDs

  // Session management (simple in-memory for demo)
  const sessions = new Map<string, { userId: string; expires: Date; userData?: any }>();

  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Handle client authentication
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth') {
          const userId = validateSession(data.token);
          if (userId) {
            const session = sessions.get(data.token);
            connectedClients.set(clientId, { 
              ws, 
              userId, 
              userData: session?.userData 
            });
            
            // Track user connections
            if (!userConnections.has(userId)) {
              userConnections.set(userId, []);
            }
            userConnections.get(userId)?.push(clientId);
            
            ws.send(JSON.stringify({ 
              type: 'auth_success', 
              userId,
              message: 'Real-time connection established' 
            }));
            
            // Broadcast user online status
            broadcastToAll({
              type: 'user_online',
              userId,
              username: session?.userData?.username
            });
          } else {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      const client = connectedClients.get(clientId);
      if (client) {
        // Remove from user connections
        const connections = userConnections.get(client.userId);
        if (connections) {
          const index = connections.indexOf(clientId);
          if (index > -1) connections.splice(index, 1);
          if (connections.length === 0) {
            userConnections.delete(client.userId);
            // Broadcast user offline status
            broadcastToAll({
              type: 'user_offline',
              userId: client.userId,
              username: client.userData?.username
            });
          }
        }
        connectedClients.delete(clientId);
      }
      console.log(`WebSocket client disconnected: ${clientId}`);
    });
  });

  // Real-time broadcasting functions
  function broadcastToAll(data: any) {
    connectedClients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  function broadcastToUser(userId: string, data: any) {
    const connections = userConnections.get(userId);
    if (connections) {
      connections.forEach(clientId => {
        const client = connectedClients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(data));
        }
      });
    }
  }

  function broadcastToOthers(excludeUserId: string, data: any) {
    connectedClients.forEach(({ ws, userId }) => {
      if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  // Admin email patterns for validation
  const adminEmailPatterns = [
    "admin@test.com",
    "uniqueadmin2024@test.com",
    "coba@gmail.com"
  ];

  function generateSessionToken(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  function createSession(userId: string, userData?: any): string {
    const token = generateSessionToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    sessions.set(token, { userId, expires, userData });
    console.log("Created session:", { token, userId, expires });
    return token;
  }

  function validateSession(token: string): string | null {
    const session = sessions.get(token);
    if (!session || session.expires < new Date()) {
      if (session) {
        console.log("Session expired for token:", token);
        sessions.delete(token);
      } else {
        console.log("Session not found for token:", token);
      }
      return null;
    }
    console.log("Valid session for token:", token, "userId:", session.userId);
    return session.userId;
  }

  // Middleware to get current user
  async function getCurrentUser(req: any): Promise<any> {
    const authHeader = req.headers.authorization;
    console.log("Auth header received:", authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      console.log("No token found in request");
      return null;
    }
    
    console.log("Looking for session with token:", token);
    const session = sessions.get(token);
    if (!session || session.expires < new Date()) {
      if (session) {
        console.log("Session expired, deleting");
        sessions.delete(token);
      } else {
        console.log("Session not found for token");
      }
      return null;
    }
    
    // Return full user data from session
    console.log("Session data for user:", session.userId, session.userData);
    return { 
      idUsers: session.userId,
      role: session.userData?.role,
      username: session.userData?.username,
      email: session.userData?.email,
      ...session.userData
    };
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

  // Register endpoint - Direct Google Apps Script integration
  app.post("/api/register", async (req, res) => {
    try {
      const { email, username, password, nim, jurusan, gender } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, username, dan password harus diisi" });
      }

      // Call Google Apps Script register directly
      const result = await storage.makeRequest('register', { 
        email, 
        username, 
        password,
        nim: nim || '',
        jurusan: jurusan || '',
        gender: gender || 'male'
      });
      
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      if (result.user) {
        // Store complete user data in session - handle missing fields from Google Apps Script
        const userData = {
          idUsers: result.user.idUsers,
          username: result.user.username || username,
          email: result.user.email || email,
          role: result.user.role || "user",
          nim: result.user.nim || nim,
          gender: result.user.gender || gender,
          jurusan: result.user.jurusan || jurusan
        };
        
        console.log("Storing user data in session:", userData);
        const token = createSession(result.user.idUsers, userData);

        res.json({
          message: result.message || "Registrasi berhasil",
          user: {
            idUsers: result.user.idUsers,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            redirect: result.user.redirect || "/dashboard"
          },
          token
        });
      } else {
        return res.status(400).json({ message: "Registrasi gagal" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Data tidak valid", errors: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat registrasi" });
    }
  });

  // Login endpoint - Direct Google Apps Script integration
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Call Google Apps Script login directly
      const result = await storage.makeRequest('login', { email, password });
      
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      if (result.user) {
        // Create session with user data
        const token = createSession(result.user.idUsers, result.user);

        res.json({
          message: result.message || "Login berhasil",
          user: {
            idUsers: result.user.idUsers,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            redirect: result.user.redirect || "/dashboard"
          },
          token
        });
      } else {
        return res.status(400).json({ message: "Login gagal" });
      }
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

      // Simple validation - just check required fields
      const { judul, deskripsi, imageUrl } = req.body;
      
      if (!judul || !deskripsi) {
        return res.status(400).json({ message: "Judul dan deskripsi harus diisi" });
      }
      
      const postId = generatePostId();
      const post = await storage.createPost({
        judul,
        deskripsi,
        imageUrl: imageUrl || "",
        idPostingan: postId,
        idUsers: currentUser.idUsers
      });

      // Broadcast new post to all connected clients in real-time
      broadcastToAll({
        type: 'new_post',
        post: {
          ...post,
          username: currentUser.username,
          userRole: currentUser.role
        },
        timestamp: new Date().toISOString(),
        message: `${currentUser.username} membuat post baru: ${post.judul}`
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

      // Broadcast post update to all connected clients in real-time
      broadcastToAll({
        type: 'post_updated',
        post: {
          ...updatedPost,
          username: currentUser.username,
          userRole: currentUser.role
        },
        timestamp: new Date().toISOString(),
        message: `${currentUser.username} memperbarui post: ${updatedPost.judul}`
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

  // Delete post - Fixed to properly handle user ownership verification
  app.delete("/api/posts/:postId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized - Harap login terlebih dahulu" });
      }

      const { postId } = req.params;
      
      console.log("Delete attempt:", {
        userId: currentUser.idUsers,
        postId: postId,
        userRole: currentUser.role,
        username: currentUser.username
      });

      // Check for admin privileges
      const isAdmin = currentUser.role === "admin" || currentUser.role === "Admin" ||
                     currentUser.email?.includes("admin") ||
                     currentUser.username?.includes("admin") ||
                     adminEmailPatterns.includes(currentUser.email || "");
      
      if (isAdmin) {
        // Admin can delete any post
        console.log("Admin deleting post:", postId, "by user:", currentUser.username);
        
        try {
          const deleteResult = await storage.deletePost(postId, currentUser.idUsers);
          
          if (deleteResult) {
            broadcastToAll({
              type: 'post_deleted',
              postId: postId,
              deletedBy: currentUser.username,
              isAdmin: true,
              timestamp: new Date().toISOString(),
              message: `Admin ${currentUser.username} menghapus post`
            });
            
            return res.json({
              message: "Post berhasil dihapus oleh admin",
              success: true
            });
          } else {
            return res.status(500).json({
              message: "Gagal menghapus post",
              success: false
            });
          }
        } catch (deleteError) {
          console.error("Admin delete error:", deleteError);
          return res.status(500).json({
            message: "Terjadi kesalahan saat menghapus post",
            success: false,
            error: deleteError instanceof Error ? deleteError.message : String(deleteError)
          });
        }
      }

      // For regular users, check if they own the post
      try {
        const existingPost = await storage.getPost(postId);
        
        if (!existingPost) {
          return res.status(404).json({ message: "Post tidak ditemukan" });
        }

        console.log("Ownership check:", {
          postOwner: existingPost.idUsers,
          currentUser: currentUser.idUsers,
          matches: existingPost.idUsers === currentUser.idUsers
        });

        if (existingPost.idUsers !== currentUser.idUsers) {
          return res.status(403).json({ 
            message: "Anda tidak memiliki izin untuk menghapus post ini",
            details: "Hanya pemilik post atau admin yang dapat menghapus post"
          });
        }

        // User owns the post - proceed with deletion
        console.log("User owns post, proceeding with deletion");
        const deleted = await storage.deletePost(postId, currentUser.idUsers);
        
        if (!deleted) {
          return res.status(500).json({ 
            message: "Gagal menghapus post",
            details: "Terjadi kesalahan pada server saat menghapus post"
          });
        }

        // Broadcast post deletion to all connected clients in real-time
        broadcastToAll({
          type: 'post_deleted',
          postId: postId,
          deletedBy: currentUser.username,
          isAdmin: false,
          timestamp: new Date().toISOString(),
          message: `${currentUser.username} menghapus post mereka`
        });

        res.json({ 
          message: "Post berhasil dihapus",
          success: true
        });

      } catch (getPostError) {
        console.error("Error getting post for ownership check:", getPostError);
        return res.status(500).json({ 
          message: "Gagal memverifikasi kepemilikan post",
          details: "Terjadi kesalahan saat mengakses data post"
        });
      }

    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ 
        message: "Terjadi kesalahan saat menghapus post",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Like/dislike post
  app.post("/api/posts/:postId/like", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        console.log("Unauthorized like attempt - no current user");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { postId } = req.params;
      const { type } = req.body;
      
      console.log("Like/dislike request:", { postId, type, userId: currentUser.idUsers });

      // Call Google Apps Script directly for likePost action
      const result = await storage.makeRequest('likePost', {
        postId: postId,
        userId: currentUser.idUsers,
        type: type
      });

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      // Broadcast like/dislike to all connected clients in real-time
      broadcastToAll({
        type: 'post_interaction',
        postId: postId,
        interactionType: type,
        userId: currentUser.idUsers,
        username: currentUser.username,
        post: result.post,
        timestamp: new Date().toISOString(),
        message: `${currentUser.username} ${type === 'like' ? 'menyukai' : 'tidak menyukai'} post`
      });

      res.json({
        message: result.message || `Post berhasil di-${type}`,
        post: result.post,
        success: true
      });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat memproses like" });
    }
  });

  // Upload image for profile
  app.post("/api/upload", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Handle JSON data with base64 image
      if (!req.body || !req.body.imageData) {
        console.log("Upload request body:", req.body);
        return res.status(400).json({ message: "No image provided" });
      }

      // Process image data for Google Apps Script
      let imageBase64 = req.body.imageData;
      const fileName = req.body.fileName || `image_${currentUser.idUsers}_${Date.now()}.jpg`;

      // Remove data URL prefix if present (data:image/jpeg;base64,)
      if (imageBase64.includes(',')) {
        imageBase64 = imageBase64.split(',')[1];
      }

      console.log("Processing image upload:", { fileName, dataLength: imageBase64.length });

      // Try Google Apps Script upload first, then fallback to data URL
      let result;
      try {
        result = await storage.makeRequest('uploadImage', {
          imageBase64: imageBase64,
          fileName: fileName,
          userId: currentUser.idUsers
        });
        
        // If Google Apps Script upload fails, use data URL as fallback
        if (result.error) {
          console.log("Google Drive upload failed, using data URL fallback");
          const mimeType = fileName.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${imageBase64}`;
          
          result = {
            message: "Image uploaded as data URL",
            imageUrl: dataUrl,
            fileName: fileName
          };
        }
      } catch (uploadError) {
        console.log("Upload error, using data URL fallback:", uploadError);
        const mimeType = fileName.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${imageBase64}`;
        
        result = {
          message: "Image uploaded as data URL",
          imageUrl: dataUrl,
          fileName: fileName
        };
      }

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        message: "Upload berhasil",
        imageUrl: result.imageUrl || result.url,
        success: true
      });
    } catch (error) {
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

      const userPosts = await storage.getUserPosts(currentUser.idUsers);

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
      const totalLikes = allPosts.reduce((sum, post) => sum + (post.like || 0), 0);
      const totalDislikes = allPosts.reduce((sum, post) => sum + (post.dislike || 0), 0);

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
      const comments = await storage.getComments(postId);
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
        console.log("Unauthorized comment attempt - no current user");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { postId } = req.params;
      const { comment } = req.body;
      
      console.log("Create comment request:", { postId, comment, userId: currentUser.idUsers });

      // Call Google Apps Script directly for createComment action
      const result = await storage.makeRequest('createComment', {
        idPostingan: postId,
        idUsers: currentUser.idUsers,
        comment: comment
      });

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      res.json({
        message: result.message || "Komentar berhasil dibuat",
        comment: result.comment,
        success: true
      });
    } catch (error) {
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
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }

      const userPosts = await storage.getUserPosts(userId);
      
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

  // Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter diperlukan" });
      }

      const posts = await storage.searchPosts(q);
      res.json({ posts });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat pencarian" });
    }
  });

  // Notifications endpoint
  app.get("/api/notifications", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notifications = await storage.getUserNotifications(currentUser.idUsers);
      res.json({ notifications });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil notifikasi" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:notificationId/read", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { notificationId } = req.params;
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (success) {
        res.json({ message: "Notifikasi berhasil ditandai dibaca" });
      } else {
        res.status(404).json({ message: "Notifikasi tidak ditemukan" });
      }
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Terjadi kesalahan" });
    }
  });

  // Admin endpoints for user management
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - Admin only" });
      }

      const { userId } = req.params;
      const success = await storage.deleteUser(userId);
      
      if (success) {
        res.json({ message: "User berhasil dihapus" });
      } else {
        res.status(404).json({ message: "User tidak ditemukan" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat menghapus user" });
    }
  });

  app.delete("/api/admin/users/:userId/posts", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - Admin only" });
      }

      const { userId } = req.params;
      const success = await storage.deleteUserPosts(userId);
      
      if (success) {
        res.json({ message: "Semua postingan user berhasil dihapus" });
      } else {
        res.status(404).json({ message: "User tidak ditemukan" });
      }
    } catch (error) {
      console.error("Delete user posts error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat menghapus postingan" });
    }
  });

  // Get all users for admin
  app.get("/api/admin/users", async (req, res) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied - Admin only" });
      }

      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Terjadi kesalahan saat mengambil data users" });
    }
  });

  return server;
}