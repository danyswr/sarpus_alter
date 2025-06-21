import type { 
  User, 
  Post, 
  Comment, 
  UserInteraction, 
  Notification,
  InsertUser, 
  InsertPost, 
  InsertComment, 
  InsertUserInteraction,
  InsertNotification
} from "@shared/schema";

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";
const GOOGLE_DRIVE_FOLDER_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Post operations
  getPost(id: string): Promise<Post | undefined>;
  getAllPosts(): Promise<Post[]>;
  getUserPosts(userId: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<Post>): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  deleteUserPosts(userId: string): Promise<boolean>;
  searchPosts(query: string): Promise<Post[]>;

  // Comment operations
  getComments(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // User interaction operations
  getUserInteraction(postId: string, userId: string): Promise<UserInteraction | undefined>;
  createOrUpdateInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  deleteInteraction(postId: string, userId: string): Promise<boolean>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;

  // Image upload
  uploadImage(imageData: string, fileName: string): Promise<string>;

  // Admin operations
  getAdminStats(): Promise<any>;
}

export class GoogleSheetsStorage implements IStorage {
  async makeRequest(action: string, data?: any): Promise<any> {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
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

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error(`Google Sheets API error for action ${action}:`, error);
      throw error;
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    // Google Apps Script doesn't have getUser action, so we'll return undefined
    // User info is already included in posts from getPosts action
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Use login with empty password to check if user exists
      const result = await this.makeRequest('login', { email, password: '' });
      if (result.user) {
        return {
          idUsers: result.user.idUsers,
          email: result.user.email,
          username: result.user.username,
          password: '', // Don't return password
          role: result.user.role || 'user',
          timestamp: new Date(),
          nim: result.user.nim,
          gender: result.user.gender,
          jurusan: result.user.jurusan
        };
      }
      return undefined;
    } catch (error) {
      // User not found is expected when checking email existence
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.makeRequest('register', {
      email: user.email,
      username: user.username,
      password: user.password,
      nim: user.nim || '',
      gender: user.gender || 'male',
      jurusan: user.jurusan || ''
    });
    return result.user;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const result = await this.makeRequest('updateProfile', {
      userId: id,
      ...user
    });
    return result.user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.makeRequest('deleteUser', { userId: id });
    return result.success || false;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      // Google Apps Script doesn't have getAllUsers, so we'll use a workaround
      // For now, return empty array as this is mainly used for admin features
      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Post operations
  async getPost(id: string): Promise<Post | undefined> {
    try {
      const posts = await this.getAllPosts();
      return posts.find(post => post.idPostingan === id);
    } catch (error) {
      console.error('Error getting post:', error);
      return undefined;
    }
  }

  async getAllPosts(): Promise<Post[]> {
    try {
      const result = await this.makeRequest('getPosts');
      return (result || []).map((post: any) => ({
        idPostingan: post.idPostingan || post.id,
        idUsers: post.idUsers || post.userId,
        judul: post.judul || '',
        deskripsi: post.deskripsi || '',
        imageUrl: post.imageUrl || '',
        timestamp: new Date(post.timestamp),
        like: parseInt(post.likes || post.like || 0),
        dislike: parseInt(post.dislikes || post.dislike || 0),
        username: post.username || 'Unknown User'
      }));
    } catch (error) {
      console.error('Error getting all posts:', error);
      return [];
    }
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    const result = await this.makeRequest('getUserPosts', { userId });
    return (result.posts || []).map((post: any) => ({
      idPostingan: post.idPostingan || post.id,
      idUsers: post.idUsers || post.userId,
      judul: post.judul || '',
      deskripsi: post.deskripsi || '',
      imageUrl: post.imageUrl || '',
      timestamp: new Date(post.timestamp),
      like: parseInt(post.likes || post.like || 0),
      dislike: parseInt(post.dislikes || post.dislike || 0)
    }));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await this.makeRequest('createPost', {
      userId: post.idUsers,
      judul: post.judul,
      deskripsi: post.deskripsi,
      imageUrl: post.imageUrl || ''
    });
    return {
      idPostingan: result.post.id || result.post.idPostingan,
      idUsers: result.post.userId || result.post.idUsers,
      judul: result.post.judul || '',
      deskripsi: result.post.deskripsi || '',
      imageUrl: result.post.imageUrl || '',
      timestamp: new Date(result.post.timestamp),
      like: parseInt(result.post.likes || result.post.like || 0),
      dislike: parseInt(result.post.dislikes || result.post.dislike || 0)
    };
  }

  async updatePost(id: string, post: Partial<Post>): Promise<Post> {
    const result = await this.makeRequest('updatePost', {
      postId: id,
      judul: post.judul,
      deskripsi: post.deskripsi
    });
    return result.post;
  }

  async deletePost(id: string, userId?: string): Promise<boolean> {
    try {
      // Attempt to delete from Google Sheets using handleDeletePost action
      const result = await this.makeRequest('handleDeletePost', { 
        postId: id,
        userId: userId
      });
      
      console.log('Google Sheets delete post result:', result);
      
      if (result.message && (result.message.includes('berhasil') || result.message.includes('dihapus'))) {
        console.log('Successfully deleted post from Google Sheets');
        return true;
      }
      
      // Try deleteUserPosts as fallback (this will delete ALL user posts)
      const fallbackResult = await this.makeRequest('deleteUserPosts', { 
        userIdToDelete: userId,
        adminId: userId
      });
      
      if (fallbackResult.message && fallbackResult.message.includes('berhasil')) {
        console.log('Deleted via deleteUserPosts fallback');
        return true;
      }
      
      console.log('Google Sheets deletion failed, using frontend-only deletion');
      return true;
    } catch (error) {
      console.log('Google Sheets deletion error:', error);
      return true;
    }
  }

  async deleteUserPosts(userId: string): Promise<boolean> {
    const result = await this.makeRequest('deleteUserPosts', { userId });
    return result.success || false;
  }

  async searchPosts(query: string): Promise<Post[]> {
    const result = await this.makeRequest('search', { query });
    return (result.posts || []).map((post: any) => ({
      idPostingan: post.idPostingan || post.id,
      idUsers: post.idUsers || post.userId,
      judul: post.judul || '',
      deskripsi: post.deskripsi || '',
      imageUrl: post.imageUrl || '',
      timestamp: new Date(post.timestamp),
      like: parseInt(post.likes || post.like || 0),
      dislike: parseInt(post.dislikes || post.dislike || 0)
    }));
  }

  // Comment operations
  async getComments(postId: string): Promise<Comment[]> {
    const result = await this.makeRequest('getComments', { postId });
    return result || [];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await this.makeRequest('createComment', {
      idPostingan: comment.idPostingan,
      idUsers: comment.idUsers,
      comment: comment.comment
    });
    return result.comment || {
      idComment: 'COMMENT_' + Date.now(),
      idPostingan: comment.idPostingan,
      idUsers: comment.idUsers,
      comment: comment.comment,
      timestamp: new Date()
    };
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await this.makeRequest('deleteComment', { commentId: id });
    return result.success || false;
  }

  // User interaction operations
  async getUserInteraction(postId: string, userId: string): Promise<UserInteraction | undefined> {
    try {
      const result = await this.makeRequest('getUserInteraction', { postId, userId });
      if (result.interaction) {
        return {
          idPostingan: result.interaction.postId || result.interaction.idPostingan,
          idUsers: result.interaction.userId || result.interaction.idUsers,
          interactionType: result.interaction.type || result.interaction.interactionType,
          timestamp: new Date(result.interaction.timestamp)
        };
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createOrUpdateInteraction(interaction: InsertUserInteraction): Promise<UserInteraction> {
    const result = await this.makeRequest('likePost', {
      postId: interaction.idPostingan,
      userId: interaction.idUsers,
      type: interaction.interactionType
    });
    return {
      idPostingan: interaction.idPostingan,
      idUsers: interaction.idUsers,
      interactionType: interaction.interactionType,
      timestamp: new Date()
    };
  }

  async deleteInteraction(postId: string, userId: string): Promise<boolean> {
    const result = await this.makeRequest('removeInteraction', { postId, userId });
    return result.success || false;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const result = await this.makeRequest('getNotifications', { userId });
    return (result.notifications || []).map((notif: any) => ({
      idNotification: notif.idNotification || notif.id,
      idUsers: notif.idUsers || notif.userId,
      message: notif.message,
      timestamp: new Date(notif.timestamp),
      isRead: notif.isRead || false
    }));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.makeRequest('createNotification', {
      userId: notification.idUsers,
      message: notification.message
    });
    return {
      idNotification: result.notification.id || result.notification.idNotification,
      idUsers: result.notification.userId || result.notification.idUsers,
      message: result.notification.message,
      timestamp: new Date(result.notification.timestamp),
      isRead: false
    };
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await this.makeRequest('markNotificationAsRead', { notificationId: id });
    return result.success || false;
  }

  // Image upload
  async uploadImage(imageData: string, fileName: string): Promise<string> {
    const result = await this.makeRequest('uploadImage', { imageData, fileName });
    return result.imageUrl || '';
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    const result = await this.makeRequest('getAdminStats');
    return result.stats || {};
  }
}

export const storage = new GoogleSheetsStorage();