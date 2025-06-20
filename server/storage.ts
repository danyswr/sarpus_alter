import { 
  type User, 
  type InsertUser, 
  type Post, 
  type InsertPost,
  type Comment,
  type InsertComment,
  type UserInteraction,
  type InsertUserInteraction
} from "@shared/schema";

export interface IStorage {
  // User methods
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

  // Comment methods
  getCommentsByPost(idPostingan: string): Promise<Comment[]>;
  createComment(comment: InsertComment & { idComment: string }): Promise<Comment>;
  deleteComment(idComment: string): Promise<boolean>;

  // User interaction methods
  createUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  getUserInteraction(idPostingan: string, idUsers: string): Promise<UserInteraction | undefined>;
  updateUserInteraction(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<UserInteraction>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private posts: Map<string, Post>;
  private comments: Map<string, Comment>;
  private userInteractions: Map<string, UserInteraction>;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.userInteractions = new Map();

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByIdUsers(idUsers: string): Promise<User | undefined> {
    return this.users.get(idUsers);
  }

  async createUser(insertUser: InsertUser & { idUsers: string; role?: string }): Promise<User> {
    const user: User = {
      ...insertUser,
      role: insertUser.role || "user",
      createdAt: new Date(),
    };
    this.users.set(user.idUsers, user);
    return user;
  }

  async updateUser(idUsers: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUserByIdUsers(idUsers);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(idUsers, updatedUser);
    return updatedUser;
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getPostsByUser(idUsers: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.idUsers === idUsers)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getPost(idPostingan: string): Promise<Post | undefined> {
    return this.posts.get(idPostingan);
  }

  async createPost(insertPost: InsertPost & { idPostingan: string; idUsers: string }): Promise<Post> {
    const post: Post = {
      ...insertPost,
      likeCount: 0,
      dislikeCount: 0,
      timestamp: new Date(),
    };
    this.posts.set(post.idPostingan, post);
    return post;
  }

  async updatePost(idPostingan: string, updates: Partial<Post>): Promise<Post | undefined> {
    const post = await this.getPost(idPostingan);
    if (!post) return undefined;

    const updatedPost = { ...post, ...updates };
    this.posts.set(idPostingan, updatedPost);
    return updatedPost;
  }

  async deletePost(idPostingan: string): Promise<boolean> {
    return this.posts.delete(idPostingan);
  }

  async likePost(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<Post | undefined> {
    const post = await this.getPost(idPostingan);
    if (!post) return undefined;

    // Handle like/dislike logic through user interactions
    const existingInteraction = await this.getUserInteraction(idPostingan, idUsers);
    
    if (existingInteraction) {
      if (existingInteraction.interactionType === type) {
        // Remove the interaction (toggle off)
        this.userInteractions.delete(`${idPostingan}_${idUsers}`);
      } else {
        // Update the interaction type
        await this.updateUserInteraction(idPostingan, idUsers, type);
      }
    } else {
      // Create new interaction
      await this.createUserInteraction({
        idPostingan,
        idUsers,
        interactionType: type
      });
    }

    // Recalculate counts
    const interactions = Array.from(this.userInteractions.values())
      .filter(interaction => interaction.idPostingan === idPostingan);
    
    const likeCount = interactions.filter(i => i.interactionType === 'like').length;
    const dislikeCount = interactions.filter(i => i.interactionType === 'dislike').length;

    const updatedPost = { ...post, likeCount, dislikeCount };
    this.posts.set(idPostingan, updatedPost);
    return updatedPost;
  }

  // Comment methods
  async getCommentsByPost(idPostingan: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.idPostingan === idPostingan)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createComment(insertComment: InsertComment & { idComment: string }): Promise<Comment> {
    const comment: Comment = {
      ...insertComment,
      timestamp: new Date(),
    };
    this.comments.set(comment.idComment, comment);
    return comment;
  }

  async deleteComment(idComment: string): Promise<boolean> {
    return this.comments.delete(idComment);
  }

  // User interaction methods
  async createUserInteraction(insertInteraction: InsertUserInteraction): Promise<UserInteraction> {
    const interaction: UserInteraction = {
      ...insertInteraction,
      timestamp: new Date(),
    };
    const key = `${interaction.idPostingan}_${interaction.idUsers}`;
    this.userInteractions.set(key, interaction);
    return interaction;
  }

  async getUserInteraction(idPostingan: string, idUsers: string): Promise<UserInteraction | undefined> {
    const key = `${idPostingan}_${idUsers}`;
    return this.userInteractions.get(key);
  }

  async updateUserInteraction(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<UserInteraction> {
    const key = `${idPostingan}_${idUsers}`;
    const existing = this.userInteractions.get(key);
    
    const updated: UserInteraction = {
      idPostingan,
      idUsers,
      interactionType: type,
      timestamp: existing?.timestamp || new Date(),
    };
    
    this.userInteractions.set(key, updated);
    return updated;
  }
}

export const storage = new MemStorage();
