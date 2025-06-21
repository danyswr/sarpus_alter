import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview";
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
    queryKey: ["google-posts"],
    queryFn: () => api.posts.getAllPosts(),
    enabled: !!user,
    refetchInterval: 3000,
    staleTime: 1000,
    refetchOnWindowFocus: true,
  }) as { data: Post[], isLoading: boolean, refetch: () => void };

  const createPostMutation = useMutation({
    mutationFn: (data: { judul: string; deskripsi: string; imageUrl?: string; userId: string }) =>
      api.posts.createPost(data),
    onMutate: async (newPostData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["google-posts"] });
      
      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<Post[]>(["google-posts"]);
      
      // Optimistically add the new post to the beginning of the list
      const optimisticPost: Post = {
        idPostingan: `TEMP_${Date.now()}`,
        idUsers: user!.idUsers,
        username: user!.username,
        timestamp: new Date(),
        judul: newPostData.judul,
        deskripsi: newPostData.deskripsi,
        like: 0,
        dislike: 0,
        imageUrl: newPostData.imageUrl || ""
      };
      
      queryClient.setQueryData<Post[]>(["google-posts"], (old) => 
        old ? [optimisticPost, ...old] : [optimisticPost]
      );
      
      return { previousPosts };
    },
    onError: (err, newPostData, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["google-posts"], context.previousPosts);
      }
    },
    onSuccess: () => {
      // Clear the form
      setNewPost({ judul: "", deskripsi: "", imageUrl: "" });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["google-posts"] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'like' | 'dislike' }) =>
      api.posts.likePost(postId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["google-posts"] });
      
      // Optimistically remove the post from the UI immediately
      const previousPosts = queryClient.getQueryData(["google-posts"]);
      queryClient.setQueryData(["google-posts"], (old: any) => {
        if (!old) return old;
        return old.filter((post: any) => post.idPostingan !== postId);
      });
      
      return { previousPosts };
    },
    onSuccess: (data, postId) => {
      // Permanently remove post from cache and prevent it from coming back
      queryClient.setQueryData(["google-posts"], (old: any) => {
        if (!old) return old;
        const filtered = old.filter((post: any) => post.idPostingan !== postId);
        console.log(`Post ${postId} permanently removed. Remaining posts:`, filtered.length);
        return filtered;
      });
      
      // Mark this post as deleted in local storage to prevent refetch showing it
      const deletedPosts = JSON.parse(localStorage.getItem('deletedPosts') || '[]');
      if (!deletedPosts.includes(postId)) {
        deletedPosts.push(postId);
        localStorage.setItem('deletedPosts', JSON.stringify(deletedPosts));
      }
    },
    onError: (err, postId, context) => {
      // Restore the previous data on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["google-posts"], context.previousPosts);
      }
      console.error('Delete failed:', err);
    },
    onSettled: (data, error, postId) => {
      // Only invalidate if there was an error, otherwise keep the optimistic update
      if (error) {
        queryClient.invalidateQueries({ queryKey: ["google-posts"] });
      }
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
                    
                    {/* Image Upload Component */}
                    <ImageUploadWithPreview
                      onImageUpload={handleImageUpload}
                      onImageRemove={() => setNewPost(prev => ({ ...prev, imageUrl: "" }))}
                      imageUrl={newPost.imageUrl}
                      isUploading={uploadImageMutation.isPending}
                      disabled={createPostMutation.isPending}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                    <div className="flex items-center space-x-1">

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
                    const idA = parseInt((a.idPostingan || '0').replace(/\D/g, '') || '0');
                    const idB = parseInt((b.idPostingan || '0').replace(/\D/g, '') || '0');
                    return idB - idA;
                  }
                  
                  return dateB - dateA;
                })
                .map((post: Post, index: number) => {
                console.log(`Rendering post ${post.idPostingan}:`, post);
                // Create a truly unique key by combining all available identifiers
                const baseId = post.idPostingan || `temp-${index}`;
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
