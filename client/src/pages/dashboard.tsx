import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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
          <Card className="hidden md:block mb-6 border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div 
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors text-gray-500 text-center"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    <div className="space-y-2">
                      <p className="text-lg">💭 Ada keluh kesah atau saran?</p>
                      <p className="text-sm">Klik di sini untuk berbagi dengan komunitas</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-secondary hover:bg-secondary/10"
                        onClick={() => setCreatePostOpen(true)}
                      >
                        📷 Tambah Gambar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-accent hover:bg-accent/10"
                        onClick={() => setCreatePostOpen(true)}
                      >
                        ✨ Buat Postingan
                      </Button>
                    </div>
                    <Button 
                      className="btn-primary px-6"
                      onClick={() => setCreatePostOpen(true)}
                    >
                      Mulai Posting
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

      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="create-post-description">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              Buat Postingan Baru
            </DialogTitle>
            <DialogDescription id="create-post-description" className="text-gray-600">
              Bagikan keluh kesah, saran, atau pengalaman Anda dengan komunitas mahasiswa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Judul Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center">
                📝 Judul Postingan
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                value={newPost.judul}
                onChange={(e) => setNewPost(prev => ({ ...prev, judul: e.target.value }))}
                placeholder="Berikan judul yang menarik untuk postinganmu..."
                className="text-base p-3 border-2 focus:border-primary"
              />
              <p className="text-xs text-gray-500">Tips: Gunakan judul yang jelas dan deskriptif</p>
            </div>

            {/* Deskripsi Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center">
                💬 Ceritakan Detail
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Textarea
                value={newPost.deskripsi}
                onChange={(e) => setNewPost(prev => ({ ...prev, deskripsi: e.target.value }))}
                placeholder="Ceritakan secara detail keluh kesah, saran, atau pengalamanmu di kampus..."
                rows={6}
                className="text-base p-3 border-2 focus:border-primary resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Jelaskan situasi, dampak, dan saran perbaikan</p>
                <span className="text-xs text-gray-400">{newPost.deskripsi.length}/1000</span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center">
                📷 Tambah Gambar (Opsional)
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-1">
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  imageUrl={newPost.imageUrl}
                  onRemoveImage={() => setNewPost(prev => ({ ...prev, imageUrl: "" }))}
                />
              </div>
              {uploadImageMutation.isPending && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Mengupload gambar ke Google Drive...</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Gambar akan disimpan secara aman di Google Drive. Maksimal 5MB.
              </p>
            </div>

            {/* Preview Post */}
            {(newPost.judul.trim() || newPost.deskripsi.trim() || newPost.imageUrl) && (
              <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">👀 Preview Postingan:</h4>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-800">{user.username}</span>
                        <span className="text-gray-500 text-sm">• sekarang</span>
                      </div>
                      {newPost.judul.trim() && (
                        <h3 className="font-bold text-gray-900 mb-2">{newPost.judul}</h3>
                      )}
                      {newPost.deskripsi.trim() && (
                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{newPost.deskripsi}</p>
                      )}
                      {newPost.imageUrl && (
                        <img 
                          src={newPost.imageUrl} 
                          alt="Preview" 
                          className="max-w-full h-auto rounded-lg border"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCreatePostOpen(false);
                  setNewPost({ judul: "", deskripsi: "", imageUrl: "" });
                }}
                className="px-6"
              >
                Batal
              </Button>
              <Button 
                className="btn-primary px-6"
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending || !newPost.judul.trim() || !newPost.deskripsi.trim()}
              >
                {createPostMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Memposting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>📢</span>
                    <span>Publikasikan</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
