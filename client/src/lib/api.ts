// API configuration for Google Apps Script backend
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";

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

// Helper function to make API calls
async function makeApiCall(action: string, data: any = {}): Promise<ApiResponse> {
  try {
    console.log('Making API call:', action, data);
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });

    console.log('Response status:', response.status);
    
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
    return makeApiCall('login', { email, password });
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    nim?: string;
    jurusan?: string;
    gender?: string;
  }): Promise<ApiResponse> => {
    return makeApiCall('register', userData);
  }
};

// Posts API
export const postsApi = {
  getAllPosts: async (): Promise<ApiResponse> => {
    return makeApiCall('getPosts');
  },

  createPost: async (postData: {
    userId: string;
    judul?: string;
    deskripsi: string;
    imageUrl?: string;
  }): Promise<ApiResponse> => {
    return makeApiCall('createPost', postData);
  },

  likePost: async (postId: string): Promise<ApiResponse> => {
    return makeApiCall('likePost', { postId });
  },

  dislikePost: async (postId: string): Promise<ApiResponse> => {
    return makeApiCall('dislikePost', { postId });
  }
};

// User API
export const userApi = {
  getProfile: async (userId: string): Promise<ApiResponse> => {
    return makeApiCall('getProfile', { userId });
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<ApiResponse> => {
    return makeApiCall('updateProfile', { userId, ...updates });
  }
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<ApiResponse> => {
    return makeApiCall('getAdminStats');
  }
};

// Upload API
export const uploadApi = {
  uploadImage: async (imageBase64: string, fileName?: string): Promise<ApiResponse> => {
    return makeApiCall('uploadImage', { imageBase64, fileName });
  }
};

// Test connection
export const testConnection = async (): Promise<ApiResponse> => {
  return makeApiCall('test');
};