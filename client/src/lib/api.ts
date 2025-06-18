// API configuration - use local Express server as proxy
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
}

export interface Post {
  id: string;
  idPostingan: string;
  idUsers: string;
  userId: string;
  username: string;
  timestamp: string;
  judul: string;
  deskripsi: string;
  likes: number;
  dislikes: number;
  likedBy?: string[];
  dislikedBy?: string[];
  imageUrl?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  user?: User;
  posts?: Post[];
  post?: Post;
  stats?: any;
  imageUrl?: string;
}

// Helper function to make API calls through Express backend
async function apiCall(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse> {
  try {
    console.log(`Making ${method} request to ${endpoint}:`, data);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('API response:', result);
    return result;
  } catch (error) {
    console.error('API call error:', error);
    return { error: 'Connection error: ' + (error instanceof Error ? error.message : 'Unknown error') };
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    return apiCall('/auth/login', 'POST', { email, password });
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    nim?: string;
    jurusan?: string;
    gender?: string;
  }): Promise<ApiResponse> => {
    return apiCall('/auth/register', 'POST', userData);
  }
};

// Posts API
export const postsApi = {
  getAllPosts: async (): Promise<ApiResponse> => {
    const result = await apiCall('/posts', 'GET');
    return { success: true, posts: Array.isArray(result) ? result : [] };
  },

  createPost: async (postData: {
    userId: string;
    judul?: string;
    deskripsi: string;
    imageUrl?: string;
  }): Promise<ApiResponse> => {
    return apiCall('/posts', 'POST', postData);
  },

  likePost: async (postId: string, type: 'like' | 'dislike', userId: string): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}/like`, 'POST', { type, userId });
  },

  updatePost: async (postId: string, updateData: {
    judul?: string;
    deskripsi?: string;
    userId: string;
  }): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}`, 'PUT', updateData);
  },

  deletePost: async (postId: string, userId: string): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}`, 'DELETE', { userId });
  }
};

// User API
export const userApi = {
  getProfile: async (userId: string): Promise<ApiResponse> => {
    return apiCall(`/users/${userId}`, 'GET');
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<ApiResponse> => {
    return apiCall(`/users/${userId}`, 'PUT', updates);
  }
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<ApiResponse> => {
    return apiCall('/admin/stats', 'GET');
  }
};

// Upload API
export const uploadApi = {
  uploadImage: async (imageBase64: string, fileName?: string): Promise<ApiResponse> => {
    return apiCall('/upload', 'POST', { imageBase64, fileName });
  }
};

// Test connection
export const testConnection = async (): Promise<ApiResponse> => {
  return apiCall('/test', 'GET');
};

// Legacy API functions for backward compatibility
export const getPosts = async (): Promise<Post[]> => {
  const result = await postsApi.getAllPosts();
  return result.posts || [];
};

export const createPost = async (postData: {
  idUsers: string;
  judul?: string;
  deskripsi: string;
  imageUrl?: string;
}): Promise<ApiResponse> => {
  return apiCall('/posts', 'POST', {
    userId: postData.idUsers,
    judul: postData.judul,
    deskripsi: postData.deskripsi,
    imageUrl: postData.imageUrl
  });
};

export const updatePost = async (postId: string, postData: {
  judul?: string;
  deskripsi?: string;
  userId: string;
}): Promise<ApiResponse> => {
  return apiCall(`/posts/${postId}`, 'PUT', postData);
};

export const likePost = async (postId: string, userId: string, type: 'like' | 'dislike'): Promise<ApiResponse> => {
  return apiCall(`/posts/${postId}/like`, 'POST', { type, userId });
};

export const deletePost = async (postId: string, userId: string): Promise<ApiResponse> => {
  return apiCall(`/posts/${postId}`, 'DELETE', { userId });
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
        
        console.log('Uploading image to Google Drive...');
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