// Google Apps Script API URL
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
  const requestData = {
    action,
    ...data
  };

  try {
    // Try POST request first
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
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
    
    // Fallback to GET request for some actions
    if (action === 'getPosts' || action === 'test') {
      try {
        const params = new URLSearchParams({ action, ...data });
        const getResponse = await fetch(`${GOOGLE_SCRIPT_URL}?${params.toString()}`, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (getResponse.ok) {
          const result = await getResponse.json();
          if (!result.error) {
            return result;
          }
        }
      } catch (getError) {
        console.error('GET fallback also failed:', getError);
      }
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
    return makeGoogleRequest('login', { email, password });
  },

  async register(userData: any): Promise<any> {
    return makeGoogleRequest('register', userData);
  }
};
