import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/image-upload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
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
  });

  const createPostMutation = useMutation({
    mutationFn: (data: { judul: string; deskripsi: string; imageUrl?: string; idUsers: string }) =>
      api.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCreatePostOpen(false);
      setNewPost({ judul: "", deskripsi: "", imageUrl: "" });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'like' | 'dislike' }) =>
      api.likePost(postId, user!.idUsers, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.deletePost(postId, user!.idUsers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: api.uploadImage,
    onSuccess: (data) => {
      setNewPost(prev => ({ ...prev, imageUrl: data.imageUrl }));
    },
  });

  const handleCreatePost = () => {
    if (!user || !newPost.judul.trim() || !newPost.deskripsi.trim()) return;

    createPostMutation.mutate({
      ...newPost,
      idUsers: user.idUsers,
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
        onCreatePost={() => setCreatePostOpen(true)}
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
            onClick={() => setCreatePostOpen(true)}
            className="btn-primary"
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-w-2xl mx-auto py-6 px-4">
          {/* Create Post Card - Desktop */}
          <Card className="hidden md:block mb-6">
            <CardContent className="p-6">
              <div className="flex space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Apa yang ingin kamu sampaikan?"
                    className="mb-3 resize-none"
                    rows={3}
                    onClick={() => setCreatePostOpen(true)}
                    readOnly
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <Button variant="ghost" size="sm" className="text-secondary">
                        📷 Gambar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-accent">
                        😊 Emoji
                      </Button>
                    </div>
                    <Button 
                      className="btn-primary"
                      onClick={() => setCreatePostOpen(true)}
                    >
                      Posting
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
              {posts.map((post: Post) => (
                <PostCard
                  key={post.id || post.idPostingan}
                  post={post}
                  onLike={(postId, type) => likePostMutation.mutate({ postId, type })}
                  onDelete={(postId) => deletePostMutation.mutate(postId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent className="max-w-lg" aria-describedby="create-post-description">
          <DialogHeader>
            <DialogTitle>Buat Postingan Baru</DialogTitle>
            <DialogDescription id="create-post-description">
              Bagikan keluh kesah atau saran Anda dengan komunitas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Judul</label>
              <Input
                value={newPost.judul}
                onChange={(e) => setNewPost(prev => ({ ...prev, judul: e.target.value }))}
                placeholder="Masukkan judul postingan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deskripsi</label>
              <Textarea
                value={newPost.deskripsi}
                onChange={(e) => setNewPost(prev => ({ ...prev, deskripsi: e.target.value }))}
                placeholder="Ceritakan keluh kesah atau saranmu..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gambar (Opsional)</label>
              <ImageUpload
                onImageUpload={handleImageUpload}
                imageUrl={newPost.imageUrl}
                onRemoveImage={() => setNewPost(prev => ({ ...prev, imageUrl: "" }))}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCreatePostOpen(false)}
              >
                Batal
              </Button>
              <Button 
                className="btn-primary"
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending || !newPost.judul.trim() || !newPost.deskripsi.trim()}
              >
                {createPostMutation.isPending ? "Memposting..." : "Posting"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
