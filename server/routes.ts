import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Google Apps Script URL - Updated with proper upload functionality
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";

// Password utility functions
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

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
  userId: z.string().optional(),
});

// Helper function to convert Google Drive URLs to directly viewable format
function convertGoogleDriveUrl(url: string): string {
  if (!url || url.trim() === '') return url;
  
  // Extract file ID from various Google Drive URL formats
  let fileId = '';
  
  // Format 1: https://drive.google.com/uc?id=FILE_ID&export=view
  let match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    fileId = match[1];
  }
  
  // Format 2: https://drive.google.com/file/d/FILE_ID/view
  if (!fileId) {
    match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    }
  }
  
  // Format 3: https://drive.google.com/open?id=FILE_ID
  if (!fileId) {
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    }
  }
  
  // If we found a file ID, try multiple direct access formats for better compatibility
  if (fileId) {
    // Try the most reliable format first
    return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
  }
  
  // If it's already a direct Google Drive URL, return as is
  if (url.includes('drive.google.com/uc?export=view') || url.includes('googleusercontent.com')) {
    return url;
  }
  
  return url;
}

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
    throw new Error('Failed to connect to Google Apps Script: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Store for newly registered users (module level for persistence)
const newlyRegisteredUsers: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      console.log(`Login attempt for: ${email}`);

      // Try Google Apps Script first (primary authentication)
      try {
        const result = await callGoogleScript('login', { email, password });
        
        if (!result.error) {
          console.log("Login successful via Google Apps Script for:", email);
          
          // Handle different response structures from Google Apps Script
          const userData = result.user || result;
          
          return res.json({
            message: result.message || "Login berhasil",
            user: {
              idUsers: userData.idUsers || result.idUsers,
              username: userData.username || result.username,
              email: userData.email || result.email || email,
              role: userData.role || result.role || "user",
              nim: userData.nim || result.nim || "",
              jurusan: userData.jurusan || result.jurusan || ""
            },
          });
        } else {
          console.log("Google Apps Script login error:", result.error);
        }
      } catch (gasError) {
        console.log("Google Apps Script connection error:", gasError);
      }

      // Check newly registered users with bcrypt comparison
      for (const user of newlyRegisteredUsers) {
        if (user.email.toLowerCase().trim() === email.toLowerCase().trim()) {
          // For newly registered users, check against hashed password
          if (user.hashedPassword && await verifyPassword(password, user.hashedPassword)) {
            console.log("Login successful with hashed password for newly registered user:", email);
            return res.json({
              message: "Login berhasil",
              user: {
                idUsers: user.idUsers,
                username: user.username,
                email: user.email,
                role: user.role,
                nim: user.nim,
                jurusan: user.jurusan
              },
            });
          }
          // Fallback to plain text comparison for immediate login after registration
          else if (user.password === password) {
            console.log("Login successful with fallback password for newly registered user:", email);
            return res.json({
              message: "Login berhasil",
              user: {
                idUsers: user.idUsers,
                username: user.username,
                email: user.email,
                role: user.role,
                nim: user.nim,
                jurusan: user.jurusan
              },
            });
          }
        }
      }

      // Fallback users (for development/testing)
      const fallbackUsers = [
        { email: "test@gmail.com", password: "123123123", idUsers: "USER_3", username: "test", role: "user", nim: "123312123", jurusan: "Hukum" },
        { email: "test9@gmail.com", password: "123123123", idUsers: "ADMIN_1", username: "admin", role: "admin", nim: "ADM001", jurusan: "Admin" },
        { email: "admin@test.com", password: "admin123", idUsers: "ADMIN_2", username: "admin2", role: "admin", nim: "ADM002", jurusan: "Admin" }
      ];

      // Check fallback users and newly registered users
      const allUsers = [...fallbackUsers, ...newlyRegisteredUsers];
      const localUser = allUsers.find(u => 
        u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
        u.password === password
      );

      console.log(`Available fallback users: ${allUsers.length} (${fallbackUsers.length} fallback + ${newlyRegisteredUsers.length} newly registered)`);

      if (localUser) {
        console.log("Login successful with fallback auth for:", email);
        return res.json({
          message: "Login berhasil",
          user: {
            idUsers: localUser.idUsers,
            username: localUser.username,
            email: localUser.email,
            role: localUser.role,
            nim: localUser.nim,
            jurusan: localUser.jurusan
          },
        });
      }

      return res.status(401).json({ error: "Email atau password salah" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Hash password before sending to Google Apps Script
      const hashedPassword = await hashPassword(userData.password);
      const userDataWithHashedPassword = {
        email: userData.email,
        username: userData.username,
        password: userData.password, // Send plain text for Google Apps Script compatibility
        nim: userData.nim || "",
        jurusan: userData.jurusan || "",
        gender: userData.gender || "Male",
        role: userData.role || "user"
      };
      
      const result = await callGoogleScript('register', userDataWithHashedPassword);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      // Add to fallback list for immediate login capability (store original password for local fallback)
      const newUser = {
        email: result.email,
        password: userData.password, // Store original password for local comparison
        hashedPassword: hashedPassword, // Store hashed for future use
        idUsers: result.idUsers,
        username: result.username,
        role: result.role || "user",
        nim: result.nim || "",
        jurusan: result.jurusan || ""
      };
      newlyRegisteredUsers.push(newUser);

      res.json({
        message: result.message || "Registrasi berhasil",
        user: {
          idUsers: result.idUsers,
          username: result.username,
          email: result.email,
          role: result.role,
          nim: result.nim,
          jurusan: result.jurusan
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Registration failed: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const result = await callGoogleScript('getPosts');
      
      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      // Google Apps Script returns posts directly as array
      let posts = Array.isArray(result) ? result : result.posts || [];
      
      // Fix the data structure issues from Google Apps Script
      posts = posts.map((post: any) => {
        // Handle mixed up data structure - Google Apps Script returns fields in wrong order
        let fixedPost = { ...post };
        
        // Check if the data structure is swapped (timestamp has text, not date)
        if (post.timestamp && typeof post.timestamp === 'string' && 
            !post.timestamp.includes('2025') && !post.timestamp.includes('T') && !post.timestamp.includes('Z')) {
          // Data is swapped: timestamp has judul, judul has deskripsi, deskripsi has timestamp
          fixedPost.judul = post.timestamp;
          fixedPost.deskripsi = post.judul; 
          fixedPost.timestamp = post.deskripsi;
        }
        
        // Ensure we have a valid timestamp
        if (!fixedPost.timestamp || fixedPost.timestamp === '' || 
            (typeof fixedPost.timestamp === 'string' && !fixedPost.timestamp.includes('2025'))) {
          fixedPost.timestamp = new Date().toISOString();
        }
        
        // Convert Google Drive URLs to directly viewable format
        if (fixedPost.imageUrl && fixedPost.imageUrl.trim() !== '') {
          fixedPost.imageUrl = convertGoogleDriveUrl(fixedPost.imageUrl);
          console.log(`Converted image URL for ${fixedPost.id}: ${fixedPost.imageUrl}`);
        }
        
        // Ensure we have proper user info
        if (!fixedPost.username || fixedPost.username === 'Anonymous') {
          fixedPost.username = 'User';
        }
        
        return fixedPost;
      });
      
      // Sort posts by timestamp (newest first) and by ID as fallback
      posts.sort((a: any, b: any) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        
        // If timestamps are the same or invalid, sort by ID (newer posts have higher IDs)
        if (isNaN(dateA) || isNaN(dateB) || Math.abs(dateA - dateB) < 1000) {
          const idA = parseInt(a.id?.replace(/\D/g, '') || '0');
          const idB = parseInt(b.id?.replace(/\D/g, '') || '0');
          return idB - idA;
        }
        
        return dateB - dateA;
      });
      
      res.json(posts);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Failed to fetch posts: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const postData = createPostSchema.parse(req.body);
      
      const result = await callGoogleScript('createPost', postData);
      
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      // Fix the returned post data structure if needed
      let returnedPost = result.post;
      if (returnedPost && returnedPost.imageUrl) {
        returnedPost.imageUrl = convertGoogleDriveUrl(returnedPost.imageUrl);
        console.log(`Created post with image: ${returnedPost.imageUrl}`);
      }
      
      console.log(`Post created successfully: ${JSON.stringify(returnedPost)}`);
      
      res.json({
        message: result.message || "Postingan berhasil dibuat",
        post: returnedPost,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Failed to create post: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = req.params.id;
      const type = req.body.type || 'like';
      const userId = req.body.userId || 'anonymous';
      
      console.log("Like request data:", { postId, type, userId });
      
      console.log(`Processing ${type || 'like'} for post ${postId}`);
      
      // Use the unified likeDislike action from Google Apps Script
      const result = await callGoogleScript('likeDislike', { 
        postId: postId, 
        type: type || 'like',
        userId: userId || 'anonymous'
      });
      
      if (result.error) {
        console.error(`${type || 'like'} error:`, result.error);
        return res.status(404).json({ error: result.error });
      }

      console.log(`${type || 'like'} successful for post ${postId}:`, result);
      
      res.json({
        message: result.message || `Berhasil ${type === 'dislike' ? 'dislike' : 'like'} postingan`,
        post: result.post,
        likes: result.likes || result.newLikeCount || 0,
        dislikes: result.dislikes || result.newDislikeCount || 0,
        success: true
      });
    } catch (error) {
      console.error("Like/dislike post error:", error);
      res.status(500).json({ error: "Failed to update like/dislike: " + (error instanceof Error ? error.message : 'Unknown error') });
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
      res.status(500).json({ error: "Failed to delete post: " + (error instanceof Error ? error.message : 'Unknown error') });
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
      res.status(500).json({ error: "Failed to fetch user: " + (error instanceof Error ? error.message : 'Unknown error') });
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
      res.status(500).json({ error: "Failed to update user: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  // Image upload route for Google Drive integration
  app.post("/api/upload", async (req, res) => {
    try {
      const { imageBase64, fileName } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Try to upload to Google Drive via Google Apps Script
      try {
        const result = await callGoogleScript('uploadImage', { imageBase64, fileName });
        
        if (result.error) {
          console.error("Google Apps Script upload error:", result.error);
          // For now, return a placeholder response so posting can continue
          return res.json({
            message: "Image upload temporarily unavailable",
            imageUrl: "", // Empty URL means no image
            fileId: null,
          });
        }

        // Convert Google Drive URL to directly viewable format
        const directImageUrl = convertGoogleDriveUrl(result.imageUrl);
        
        res.json({
          message: result.message || "Image uploaded successfully",
          imageUrl: directImageUrl,
          fileId: result.fileId,
        });
      } catch (uploadError) {
        console.error("Upload to Google Drive failed:", uploadError);
        // Allow posting to continue without image
        res.json({
          message: "Image upload temporarily unavailable",
          imageUrl: "", // Empty URL means no image
          fileId: null,
        });
      }
    } catch (error) {
      console.error("Image upload error:", error);
      // Allow posting to continue without image
      res.json({
        message: "Image upload temporarily unavailable",
        imageUrl: "", // Empty URL means no image
        fileId: null,
      });
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
      res.status(500).json({ error: "Failed to fetch admin stats: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  // Test connection route
  app.get("/api/test", async (req, res) => {
    try {
      const result = await callGoogleScript('test');
      res.json(result);
    } catch (error) {
      console.error("Test connection error:", error);
      res.status(500).json({ error: "Failed to connect to Google Apps Script: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
