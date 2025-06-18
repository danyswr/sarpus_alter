// Google Apps Script API URL (URL yang sudah Anda berikan)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec";

export interface Post {
  idPostingan: string;
  idUsers: string;
  judul: string;
  deskripsi: string;
  imageUrl?: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  timestamp: string;
  username?: string;
}

export interface CreatePostData {
  judul: string;
  deskripsi: string;
  imageUrl?: string;
  idUsers: string;
}

// Helper function to make requests to Google Apps Script
async function makeGoogleRequest(action: string, data: any = {}) {
  try {
    // Untuk GET requests yang sederhana
    if (action === 'test' || action === 'getPosts') {
      const params = new URLSearchParams();
      params.append('action', action);
      
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    }

    // Untuk POST requests dengan data
    const formData = new FormData();
    formData.append('action', action);
    
    // Append semua data ke FormData
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
      }
    });

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData,
      redirect: 'follow'
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
    console.error('Google Apps Script request failed:', error);
    
    // Fallback ke demo data jika Google Apps Script belum di-setup
    if (action === 'test') {
      return { message: 'Connection successful (demo mode)' };
    }
    
    if (action === 'login') {
      // Demo users untuk testing
      if (data.email === 'admin@admin.admin' && data.password === 'admin123') {
        return {
          idUsers: 'ADMIN123',
          username: 'Admin User',
          email: 'admin@admin.admin',
          role: 'admin',
          nim: 'ADM123456',
          jurusan: 'Teknik Informatika'
        };
      }
      if (data.email === 'user@student.com' && data.password === 'user123') {
        return {
          idUsers: 'USER123',
          username: 'Mahasiswa User',
          email: 'user@student.com',
          role: 'user',
          nim: 'STD123456',
          jurusan: 'Sistem Informasi'
        };
      }
      throw new Error('Email atau password salah');
    }
    
    if (action === 'getPosts') {
      return [];
    }
    
    if (action === 'register') {
      return {
        idUsers: 'NEW' + Date.now(),
        username: data.username,
        email: data.email,
        role: 'user',
        nim: data.nim,
        jurusan: data.jurusan
      };
    }
    
    throw error;
  }
}

// Convert File to base64 for Google Drive upload
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

export const api = {
  // Test connection
  async testConnection(): Promise<{ message: string }> {
    return makeGoogleRequest('test');
  },

  // Posts
  async getPosts(): Promise<Post[]> {
    const result = await makeGoogleRequest('getPosts');
    return Array.isArray(result) ? result : [];
  },

  async createPost(data: CreatePostData): Promise<{ message: string; idPostingan: string }> {
    return makeGoogleRequest('createPost', data);
  },

  async likePost(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<{ message: string; likes: number; dislikes: number }> {
    return makeGoogleRequest('likeDislike', { idPostingan, idUsers, type });
  },

  async deletePost(idPostingan: string, idUsers: string): Promise<{ message: string }> {
    return makeGoogleRequest('deletePost', { idPostingan, idUsers });
  },

  // Image upload to Google Drive
  async uploadImage(file: File): Promise<{ message: string; imageUrl: string }> {
    const base64Data = await fileToBase64(file);
    const fileName = `${Date.now()}_${file.name}`;
    
    return makeGoogleRequest('uploadImage', {
      imageData: base64Data,
      fileName: fileName,
      mimeType: file.type
    });
  },

  // Users
  async updateProfile(idUsers: string, data: any): Promise<{ message: string }> {
    return makeGoogleRequest('updateProfile', { idUsers, ...data });
  },

  // Auth
  async login(email: string, password: string): Promise<any> {
    try {
      console.log("Making login request to Google Apps Script for:", email);
      const result = await makeGoogleRequest('login', { email, password });
      console.log("Google Apps Script login response:", result);
      return result;
    } catch (error) {
      console.error("API login request failed:", error);
      throw error;
    }
  },

  async register(userData: any): Promise<any> {
    return makeGoogleRequest('register', userData);
  }
};
