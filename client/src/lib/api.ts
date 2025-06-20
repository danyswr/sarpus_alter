// API configuration - use local Express server
const API_BASE_URL = "/api";

// Types
export interface User {
  idUsers: string;
  username: string;
  email: string;
  role: string;
  nim?: string;
  jurusan?: string;
  gender?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface Post {
  idPostingan: string;
  idUsers: string;
  userId?: string;
  judul: string;
  deskripsi: string;
  imageUrl?: string;
  timestamp: Date;
  likeCount?: number;
  dislikeCount?: number;
  like?: number;
  dislike?: number;
  likes?: number;
  dislikes?: number;
  username?: string;
  likedBy?: string[];
  dislikedBy?: string[];
}

export interface Comment {
  idComment: string;
  id?: string;
  idPostingan: string;
  idUsers: string;
  userId?: string;
  comment: string;
  commentText?: string;
  timestamp: Date | string;
  username?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  user?: User;
  posts?: Post[];
  post?: Post;
  comment?: Comment;
  comments?: Comment[];
  stats?: any;
  imageUrl?: string;
  token?: string;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  const user = localStorage.getItem("feedbacku_user");
  if (!user) return null;
  
  try {
    const userData = JSON.parse(user);
    return userData.token || null;
  } catch {
    return null;
  }
}

// Helper function to make API calls to Express server
async function apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`API Error for ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`API Success for ${endpoint}:`, result);
    return result;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    return apiCall('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    nim?: string;
    jurusan?: string;
    gender?: string;
  }): Promise<ApiResponse> => {
    return apiCall('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
};

// Posts API
export const postsApi = {
  getAllPosts: async (): Promise<Post[]> => {
    return apiCall('/posts');
  },

  createPost: async (postData: {
    judul: string;
    deskripsi: string;
    imageUrl?: string;
  }): Promise<ApiResponse> => {
    return apiCall('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  likePost: async (postId: string, type: 'like' | 'dislike'): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  },

  updatePost: async (postId: string, updateData: {
    judul?: string;
    deskripsi?: string;
  }): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  deletePost: async (postId: string): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const result = await apiCall(`/posts/${postId}/comments`);
    return result.comments || [];
  },

  createComment: async (postId: string, comment: string): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  },

  deleteComment: async (commentId: string): Promise<ApiResponse> => {
    return apiCall(`/comments/${commentId}`, {
      method: 'DELETE'
    });
  }
};

// User API
export const userApi = {
  getProfile: async (userId: string): Promise<ApiResponse> => {
    return apiCall(`/users/${userId}`);
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<ApiResponse> => {
    return apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<ApiResponse> => {
    return apiCall('/admin/stats');
  }
};

// Upload API
export const uploadApi = {
  uploadImage: async (imageBase64: string, fileName?: string): Promise<ApiResponse> => {
    return apiCall('/upload', {
      method: 'POST',
      body: JSON.stringify({ imageData: imageBase64, fileName })
    });
  }
};

// Test connection
export const testConnection = async (): Promise<ApiResponse> => {
  return apiCall('/test');
};

// Legacy API functions for backward compatibility
export const getPosts = async (): Promise<Post[]> => {
  return await postsApi.getAllPosts();
};

export const createPost = async (postData: {
  judul: string;
  deskripsi: string;
  imageUrl?: string;
}): Promise<ApiResponse> => {
  return postsApi.createPost(postData);
};

export const updatePost = async (postId: string, postData: {
  judul?: string;
  deskripsi?: string;
}): Promise<ApiResponse> => {
  return postsApi.updatePost(postId, postData);
};

export const likePost = async (postId: string, type: 'like' | 'dislike'): Promise<ApiResponse> => {
  return postsApi.likePost(postId, type);
};

export const deletePost = async (postId: string): Promise<ApiResponse> => {
  return postsApi.deletePost(postId);
};

export const uploadImage = async (file: File): Promise<ApiResponse> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        if (!base64) {
          throw new Error('Failed to read file');
        }
        
        // Extract base64 data after comma
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        
        console.log('Uploading image...');
        const result = await uploadApi.uploadImage(base64Data, file.name);
        
        console.log('Upload response:', result);
        resolve(result);
      } catch (error) {
        console.error('Upload error:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

// Main API object that consolidates all APIs
export const api = {
  auth: authApi,
  posts: postsApi,
  user: userApi,
  admin: adminApi,
  upload: uploadApi,
  testConnection,
  // Legacy functions
  getPosts,
  createPost,
  likePost,
  deletePost,
  uploadImage
};