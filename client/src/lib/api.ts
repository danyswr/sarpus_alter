// API configuration - use local Express server as proxy
const API_BASE_URL = "/api";

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  nim?: string;
  jurusan?: string;
  gender?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  judul: string;
  deskripsi: string;
  likes: number;
  dislikes: number;
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
    return { posts: Array.isArray(result) ? result : [] };
  },

  createPost: async (postData: {
    userId: string;
    judul?: string;
    deskripsi: string;
    imageUrl?: string;
  }): Promise<ApiResponse> => {
    return apiCall('/posts', 'POST', postData);
  },

  likePost: async (postId: string): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}/like`, 'POST', { type: 'like' });
  },

  dislikePost: async (postId: string): Promise<ApiResponse> => {
    return apiCall(`/posts/${postId}/like`, 'POST', { type: 'dislike' });
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