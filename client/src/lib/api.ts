import { apiRequest } from "./queryClient";

export interface Post {
  id: number;
  idPostingan: string;
  idUsers: string;
  judul: string;
  deskripsi: string;
  imageUrl?: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  timestamp: Date;
  username?: string;
}

export interface CreatePostData {
  judul: string;
  deskripsi: string;
  imageUrl?: string;
  idUsers: string;
}

export const api = {
  // Posts
  async getPosts(): Promise<Post[]> {
    const response = await apiRequest("GET", "/api/posts");
    return response.json();
  },

  async createPost(data: CreatePostData): Promise<{ message: string; post: Post }> {
    const response = await apiRequest("POST", "/api/posts", data);
    return response.json();
  },

  async likePost(idPostingan: string, idUsers: string, type: 'like' | 'dislike'): Promise<{ message: string; post: Post }> {
    const response = await apiRequest("POST", `/api/posts/${idPostingan}/like`, { idUsers, type });
    return response.json();
  },

  async deletePost(idPostingan: string, idUsers: string): Promise<{ message: string }> {
    const response = await apiRequest("DELETE", `/api/posts/${idPostingan}`, { idUsers });
    return response.json();
  },

  // Image upload
  async uploadImage(file: File): Promise<{ message: string; imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return response.json();
  },

  // Users
  async updateProfile(idUsers: string, data: any): Promise<{ message: string; user: any }> {
    const response = await apiRequest("PUT", `/api/users/${idUsers}`, data);
    return response.json();
  },
};
