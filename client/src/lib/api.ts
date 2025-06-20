// API configuration - connect directly to Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";

// Types
export interface User {
  idUsers: string;
  username: string;
  email: string;
  role: string;
  nim?: string;
  jurusan?: string;
  gender?: string;
  redirect?: string;
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

export interface Comment {
  id: string;
  idComment: string;
  idPostingan: string;
  userId: string;
  idUsers?: string; // Keep for backward compatibility
  commentText: string;
  comment?: string; // Keep for backward compatibility  
  timestamp: string;
  username: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  message?: string;
  user?: User;
  posts?: Post[];
  post?: Post;
  comment?: Comment;
  stats?: any;
  imageUrl?: string;
  token?: string;
  timestamp?: string;
  status?: string;
}

// Helper function to call Google Apps Script
async function callGoogleScript(action: string, data: any = {}): Promise<ApiResponse> {
  const requestData = { action, ...data };
  
  console.log(`Calling Google Apps Script - Action: ${action}`, requestData);
  
  try {
    // Try POST method first
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    const responseText = await response.text();
    console.log(`GAS Response (${action}):`, responseText.substring(0, 300));
    
    try {
      const result = JSON.parse(responseText);
      console.log(`Success via POST - ${action}:`, result);
      return result;
    } catch (parseError) {
      // If response contains HTML, try to extract JSON
      if (responseText.includes('<!DOCTYPE html>')) {
        console.log(`HTML response detected for ${action}, trying GET method`);
      } else {
        throw parseError;
      }
    }
  } catch (error) {
    console.log(`POST method failed for ${action}:`, error);
    // Continue to GET method
  }
  
  // Try GET method with parameters
  try {
    const params = new URLSearchParams();
    Object.keys(requestData).forEach(key => {
      params.append(key, String(requestData[key]));
    });
    
    const getResponse = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/html',
      }
    });
    
    const getResponseText = await getResponse.text();
    console.log(`GET Response (${action}):`, getResponseText.substring(0, 300));
    
    try {
      const result = JSON.parse(getResponseText);
      console.log(`Success via GET - ${action}:`, result);
      return result;
    } catch (parseError) {
      console.log(`Failed to parse GET response for ${action}`);
    }
  } catch (error) {
    console.log(`GET method failed for ${action}:`, error);
  }
  
  // If both methods fail, throw error
  throw new Error(`Failed to connect to Google Apps Script for ${action}`);
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    return callGoogleScript('login', { email, password });
  },

  register: async (userData: {
    email: string;
    username: string;
    password: string;
    nim?: string;
    jurusan?: string;
    gender?: string;
  }): Promise<ApiResponse> => {
    return callGoogleScript('register', userData);
  }
};

// Posts API
export const postsApi = {
  getAllPosts: async (): Promise<Post[]> => {
    const result = await callGoogleScript('getPosts');
    // Google Apps Script returns posts directly as an array
    if (Array.isArray(result)) {
      return result;
    }
    // If wrapped in an object
    if (result && result.posts) {
      return result.posts;
    }
    return [];
  },

  createPost: async (postData: {
    userId: string;
    judul?: string;
    deskripsi: string;
    imageUrl?: string;
  }): Promise<ApiResponse> => {
    return callGoogleScript('createPost', postData);
  },

  likePost: async (postId: string, type: 'like' | 'dislike', userId: string): Promise<ApiResponse> => {
    return callGoogleScript('likePost', { postId, type, userId });
  },

  updatePost: async (postId: string, updateData: {
    judul?: string;
    deskripsi?: string;
    userId: string;
  }): Promise<ApiResponse> => {
    return callGoogleScript('updatePost', { postId, ...updateData });
  },

  deletePost: async (postId: string, userId: string): Promise<ApiResponse> => {
    return callGoogleScript('deletePost', { postId, userId });
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const result = await callGoogleScript('getComments', { postId });
    return Array.isArray(result) ? result : [];
  },

  createComment: async (postId: string, userId: string, comment: string): Promise<ApiResponse> => {
    return callGoogleScript('createComment', { postId, userId, comment });
  },

  deleteComment: async (commentId: string, userId: string): Promise<ApiResponse> => {
    return callGoogleScript('deleteComment', { commentId, userId });
  }
};

// User API
export const userApi = {
  getProfile: async (userId: string): Promise<ApiResponse> => {
    return callGoogleScript('getUserPosts', { userId });
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<ApiResponse> => {
    return callGoogleScript('updateProfile', { userId, ...updates });
  }
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<ApiResponse> => {
    return callGoogleScript('getAdminStats');
  }
};

// Upload API
export const uploadApi = {
  uploadImage: async (imageBase64: string, fileName?: string): Promise<ApiResponse> => {
    return callGoogleScript('uploadImage', { imageBase64, fileName });
  }
};

// Test connection
export const testConnection = async (): Promise<ApiResponse> => {
  return callGoogleScript('test');
};

// Legacy API functions for backward compatibility
export const getPosts = async (): Promise<Post[]> => {
  return await postsApi.getAllPosts();
};

export const createPost = async (postData: {
  idUsers: string;
  judul?: string;
  deskripsi: string;
  imageUrl?: string;
}): Promise<ApiResponse> => {
  return callGoogleScript('createPost', {
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
  return callGoogleScript('updatePost', { postId, ...postData });
};

export const likePost = async (postId: string, userId: string, type: 'like' | 'dislike'): Promise<ApiResponse> => {
  return callGoogleScript('likePost', { postId, type, userId });
};

export const deletePost = async (postId: string, userId: string): Promise<ApiResponse> => {
  return callGoogleScript('deletePost', { postId, userId });
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