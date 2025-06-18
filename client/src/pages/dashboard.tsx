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

  const { data: posts = [], isLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  }) as { data: Post[], isLoading: boolean, refetch: () => void };

  const createPostMutation = useMutation({
    mutationFn: (data: { judul: string; deskripsi: string; imageUrl?: string; userId: string }) =>
      api.posts.createPost(data),
    onMutate: async (newPostData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/posts"] });
      
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(["/api/posts"]);
      
      // Optimistically add the new post to the beginning of the list
      const optimisticPost: Post = {
        id: `TEMP_${Date.now()}`,
        idPostingan: `TEMP_${Date.now()}`,
        userId: user!.idUsers,
        idUsers: user!.idUsers,
        username: user!.username,
        timestamp: new Date().toISOString(),
        judul: newPostData.judul,
        deskripsi: newPostData.deskripsi,
        likes: 0,
        dislikes: 0,
        imageUrl: newPostData.imageUrl || ""
      };
      
      queryClient.setQueryData<Post[]>(["/api/posts"], (old) => 
        old ? [optimisticPost, ...old] : [optimisticPost]
      );
      
      return { previousPosts };
    },
    onError: (err, newPostData, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts"], context.previousPosts);
      }
    },
    onSuccess: () => {
      // Clear the form
      setNewPost({ judul: "", deskripsi: "", imageUrl: "" });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'like' | 'dislike' }) =>
      api.posts.likePost(postId, type, user!.idUsers),
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
      return api.uploadImage(file);
    },
    onSuccess: (data: any) => {
      console.log("Image upload success response:", data);
      if (data.imageUrl && data.imageUrl.trim() !== "") {
        console.log("Setting image URL:", data.imageUrl);
        setNewPost(prev => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        console.warn("No image URL received from upload");
      }
    },
    onError: (error) => {
      console.error("Image upload failed:", error);
    },
  });

  const handleCreatePost = () => {
    if (!user || !newPost.deskripsi.trim()) return;

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
                    {user.username ? user.username.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
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
                    {(newPost.imageUrl || uploadImageMutation.isPending) && (
                      <div className="relative inline-block">
                        <div className="relative w-full max-w-md">
                          {uploadImageMutation.isPending ? (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-500">
                              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                              <span className="text-sm">Mengupload ke Google Drive...</span>
                            </div>
                          ) : (
                            <img 
                              src={newPost.imageUrl} 
                              alt="Preview gambar" 
                              className="w-full h-auto rounded-lg border border-gray-200 max-h-96 object-cover"
                              onLoad={() => {
                                console.log("Preview image loaded successfully:", newPost.imageUrl);
                              }}
                              onError={(e) => {
                                console.error("Preview image failed to load:", newPost.imageUrl);
                              }}
                            />
                          )}
                        </div>
                        {!uploadImageMutation.isPending && (
                          <Button
                            onClick={() => setNewPost(prev => ({ ...prev, imageUrl: "" }))}
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 w-8 h-8 p-0 rounded-full"
                          >
                            ×
                          </Button>
                        )}
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

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => refetchPosts()}
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        Refresh
                      </Button>
                      <Button 
                        className="btn-primary rounded-full px-6 py-2 font-bold"
                        onClick={handleCreatePost}
                        disabled={createPostMutation.isPending || !newPost.deskripsi.trim() || newPost.deskripsi.length > 280}
                      >
                        {createPostMutation.isPending ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Feed Keluh Kesah</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetchPosts()}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh Feed"}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : !posts || posts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Belum ada postingan. Buat postingan pertamamu!</p>
                <Button 
                  className="btn-primary mt-4"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Postingan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {(posts as Post[])
                .sort((a, b) => {
                  // Sort by timestamp (newest first)
                  const dateA = new Date(a.timestamp).getTime();
                  const dateB = new Date(b.timestamp).getTime();
                  
                  // If timestamps are the same or invalid, sort by ID (newer posts have higher IDs)
                  if (isNaN(dateA) || isNaN(dateB) || Math.abs(dateA - dateB) < 1000) {
                    const idA = parseInt((a.idPostingan || a.id || '0').replace(/\D/g, '') || '0');
                    const idB = parseInt((b.idPostingan || b.id || '0').replace(/\D/g, '') || '0');
                    return idB - idA;
                  }
                  
                  return dateB - dateA;
                })
                .map((post: Post, index: number) => {
                console.log(`Rendering post ${post.id}:`, post);
                // Create a truly unique key by combining all available identifiers
                const baseId = post.idPostingan || post.id || `temp-${index}`;
                const timestamp = post.timestamp ? new Date(post.timestamp).getTime() : Date.now() + index;
                const content = (post.judul + post.deskripsi).slice(0, 10).replace(/\s/g, '');
                const uniqueKey = `${baseId}-${timestamp}-${content}-${index}`;
                
                return (
                  <PostCard
                    key={uniqueKey}
                    post={post}
                    onLike={(postId, type) => likePostMutation.mutate({ postId, type })}
                    onDelete={(postId) => deletePostMutation.mutate(postId)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
