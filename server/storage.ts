import { users, posts, type User, type InsertUser, type Post, type InsertPost } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByIdUsers(idUsers: string): Promise<User | undefined>;
  createUser(user: InsertUser & { idUsers: string; role?: string }): Promise<User>;
  updateUser(idUsers: string, updates: Partial<User>): Promise<User | undefined>;

  // Post methods  
  getAllPosts(): Promise<Post[]>;
  getPostsByUser(idUsers: string): Promise<Post[]>;
  getPost(idPostingan: string): Promise<Post | undefined>;
  createPost(post: InsertPost & { idPostingan: string; idUsers: string }): Promise<Post>;
  updatePost(idPostingan: string, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(idPostingan: string): Promise<boolean>;
  likePost(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<Post | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private currentUserId: number;
  private currentPostId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.currentUserId = 1;
    this.currentPostId = 1;

    // Add default admin user
    this.createUser({
      idUsers: "ADMIN123",
      username: "Admin User",
      email: "admin@admin.admin",
      password: "$2b$10$eZnHPHn5sIKgL.M.U7doAu7Opg3JDwlocnokfVWckvgmX7lN7dHvK", // hashed "admin123"
      nim: "ADM123456", 
      jurusan: "Teknik Informatika",
      role: "admin"
    });

    // Add test user for testing
    this.createUser({
      idUsers: "TEST123",
      username: "Test User",
      email: "test3@gmail.com",
      password: "$2b$10$b2MI/X5xLxOJCI6KQudau.d3nzyJGD7MltfGLxdqTGdVbhubXHDvW", // hashed "12312313"
      nim: "TEST123456",
      jurusan: "Teknik Informatika", 
      role: "user"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByIdUsers(idUsers: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.idUsers === idUsers);
  }

  async createUser(insertUser: InsertUser & { idUsers: string; role?: string }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(idUsers: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUserByIdUsers(idUsers);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }

  async getPostsByUser(idUsers: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.idUsers === idUsers)
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }

  async getPost(idPostingan: string): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(post => post.idPostingan === idPostingan);
  }

  async createPost(insertPost: InsertPost & { idPostingan: string; idUsers: string }): Promise<Post> {
    const id = this.currentPostId++;
    const post: Post = {
      ...insertPost,
      id,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      timestamp: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(idPostingan: string, updates: Partial<Post>): Promise<Post | undefined> {
    const post = await this.getPost(idPostingan);
    if (!post) return undefined;

    const updatedPost = { ...post, ...updates };
    this.posts.set(post.id, updatedPost);
    return updatedPost;
  }

  async deletePost(idPostingan: string): Promise<boolean> {
    const post = await this.getPost(idPostingan);
    if (!post) return false;

    this.posts.delete(post.id);
    return true;
  }

  async likePost(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<Post | undefined> {
    const post = await this.getPost(idPostingan);
    if (!post) return undefined;

    const likedBy = post.likedBy || [];
    const dislikedBy = post.dislikedBy || [];
    
    let newLikedBy = [...likedBy];
    let newDislikedBy = [...dislikedBy];
    let newLikes = post.likes || 0;
    let newDislikes = post.dislikes || 0;

    if (type === 'like') {
      if (likedBy.includes(idUsers)) {
        // Remove like
        newLikedBy = likedBy.filter(id => id !== idUsers);
        newLikes--;
      } else {
        // Add like and remove dislike if exists
        newLikedBy.push(idUsers);
        newLikes++;
        if (dislikedBy.includes(idUsers)) {
          newDislikedBy = dislikedBy.filter(id => id !== idUsers);
          newDislikes--;
        }
      }
    } else {
      if (dislikedBy.includes(idUsers)) {
        // Remove dislike
        newDislikedBy = dislikedBy.filter(id => id !== idUsers);
        newDislikes--;
      } else {
        // Add dislike and remove like if exists
        newDislikedBy.push(idUsers);
        newDislikes++;
        if (likedBy.includes(idUsers)) {
          newLikedBy = likedBy.filter(id => id !== idUsers);
          newLikes--;
        }
      }
    }

    const updatedPost = {
      ...post,
      likes: newLikes,
      dislikes: newDislikes,
      likedBy: newLikedBy,
      dislikedBy: newDislikedBy,
    };

    this.posts.set(post.id, updatedPost);
    return updatedPost;
  }
}

export const storage = new MemStorage();
