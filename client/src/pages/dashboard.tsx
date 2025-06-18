import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [newPost, setNewPost] = useState({
    judul: "",
    deskripsi: "",
    imageUrl: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  }) as { data: Post[], isLoading: boolean };

  const createPostMutation = useMutation({
    mutationFn: (data: { judul: string; deskripsi: string; imageUrl?: string; userId: string }) =>
      api.posts.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCreatePostOpen(false);
      setNewPost({ judul: "", deskripsi: "", imageUrl: "" });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'like' | 'dislike' }) =>
      api.posts.likePost(postId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      return api.upload.uploadImage(base64, file.name);
    },
    onSuccess: (data: any) => {
      if (data.imageUrl) {
        setNewPost(prev => ({ ...prev, imageUrl: data.imageUrl }));
      }
    },
  });

  const handleCreatePost = () => {
    if (!user || !newPost.judul.trim() || !newPost.deskripsi.trim()) return;

    createPostMutation.mutate({
      ...newPost,
      userId: user.idUsers,
    });
  };

  const handleImageUpload = (file: File) => {
    uploadImageMutation.mutate(file);
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onCreatePost={() => {
          const textarea = document.querySelector('.mobile-post-input') as HTMLTextAreaElement;
          textarea?.focus();
        }}
      />

      <div className="md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </Button>
          <h1 className="font-bold">FeedbackU</h1>
          <Button
            onClick={() => {
              const textarea = document.querySelector('.mobile-post-input') as HTMLTextAreaElement;
              textarea?.focus();
            }}
            className="btn-primary"
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-w-2xl mx-auto py-6 px-4">
          {/* Twitter-style Create Post Card */}
          <Card className="mb-6 border border-gray-200">
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="space-y-3">
                    {/* Judul Input */}
                    <Input
                      value={newPost.judul}
                      onChange={(e) => setNewPost(prev => ({ ...prev, judul: e.target.value }))}
                      placeholder="Berikan judul untuk keluh kesahmu..."
                      className="text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-gray-500"
                    />
                    {/* Deskripsi Textarea */}
                    <Textarea
                      value={newPost.deskripsi}
                      onChange={(e) => setNewPost(prev => ({ ...prev, deskripsi: e.target.value }))}
                      placeholder="Apa yang terjadi di kampus?"
                      className="text-base border-0 px-0 resize-none focus-visible:ring-0 placeholder:text-gray-500 min-h-[80px] mobile-post-input"
                      rows={3}
                    />
                    
                    {/* Image Preview */}
                    {newPost.imageUrl && (
                      <div className="relative inline-block">
                        <img 
                          src={newPost.imageUrl} 
                          alt="Uploaded" 
                          className="max-w-full h-auto rounded-lg border border-gray-200 max-h-96"
                        />
                        <Button
                          onClick={() => setNewPost(prev => ({ ...prev, imageUrl: "" }))}
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full"
                        >
                          ×
                        </Button>
                      </div>
                    )}

                    {/* Upload Status */}
                    {uploadImageMutation.isPending && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 py-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>Mengupload gambar...</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center space-x-1">
                      {/* Image Upload Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 p-2"
                        onClick={() => document.getElementById('image-upload-input')?.click()}
                        disabled={uploadImageMutation.isPending}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </Button>
                      
                      {/* Hidden file input */}
                      <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                      />

                      <span className="text-sm text-gray-500">
                        {newPost.deskripsi.length}/280
                      </span>
                    </div>

                    <Button 
                      className="btn-primary rounded-full px-6 py-2 font-bold"
                      onClick={handleCreatePost}
                      disabled={createPostMutation.isPending || !newPost.judul.trim() || !newPost.deskripsi.trim() || newPost.deskripsi.length > 280}
                    >
                      {createPostMutation.isPending ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Belum ada postingan. Buat postingan pertamamu!</p>
                <Button 
                  className="btn-primary mt-4"
                  onClick={() => setCreatePostOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Postingan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {(posts as Post[]).map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={(postId, type) => likePostMutation.mutate({ postId, type })}
                  onDelete={(postId) => deletePostMutation.mutate(postId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
