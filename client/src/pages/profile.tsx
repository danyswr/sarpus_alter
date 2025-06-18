import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import { Edit, Save, X } from "lucide-react";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    nim: "",
    jurusan: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
    if (user) {
      setEditForm({
        username: user.username,
        email: user.email,
        nim: user.nim || "",
        jurusan: user.jurusan || "",
      });
    }
  }, [user, authLoading, setLocation]);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  }) as { data: Post[], isLoading: boolean };

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof editForm) => api.user.updateProfile(user!.idUsers, data),
    onSuccess: () => {
      setSuccess("Profil berhasil diperbarui!");
      setIsEditing(false);
      setError("");
      // Refresh user data would be handled here in a real app
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
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

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const userPosts = posts.filter((post: Post) => post.idUsers === user.idUsers);
  const userStats = {
    posts: userPosts.length,
    likes: userPosts.reduce((sum: number, post: Post) => sum + (post.likes || 0), 0),
    totalPosts: posts.length,
  };

  const jurusanOptions = [
    "Teknik Informatika",
    "Sistem Informasi",
    "Teknik Elektro", 
    "Teknik Sipil",
    "Manajemen",
    "Akuntansi",
    "Hukum",
    "Kedokteran"
  ];

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} />

      <div className="md:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </Button>
          <h1 className="font-bold">Profil</h1>
          <div></div>
        </div>

        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Profile Header */}
          <Card className="mb-6">
            {/* Cover Photo */}
            <div className="h-48 bg-gradient-to-r from-primary via-secondary to-accent rounded-t-xl relative">
              <img 
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
                alt="University campus" 
                className="w-full h-full object-cover rounded-t-xl opacity-80"
              />
            </div>
            
            <CardContent className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 relative">
                <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="w-32 h-32 bg-gradient-to-r from-primary to-secondary rounded-full border-4 border-white flex items-center justify-center relative z-10">
                    <span className="text-white text-4xl font-bold">
                      {user.username ? user.username.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="text-center sm:text-left">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                          className="text-2xl font-bold"
                        />
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          type="email"
                        />
                        <Input
                          value={editForm.nim}
                          onChange={(e) => setEditForm(prev => ({ ...prev, nim: e.target.value }))}
                          placeholder="NIM"
                        />
                        <Select
                          value={editForm.jurusan}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, jurusan: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Jurusan" />
                          </SelectTrigger>
                          <SelectContent>
                            {jurusanOptions.map((jurusan) => (
                              <SelectItem key={jurusan} value={jurusan}>
                                {jurusan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-gray-500 text-sm">NIM: {user.nim}</p>
                        <p className="text-gray-500 text-sm">{user.jurusan}</p>
                        <p className="text-gray-500 text-sm capitalize">Role: {user.role}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4 sm:mt-0">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        className="btn-primary"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            username: user.username,
                            email: user.email,
                            nim: user.nim || "",
                            jurusan: user.jurusan || "",
                          });
                        }}
                        variant="outline"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Batal
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="btn-primary"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profil
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{userStats.posts}</p>
                  <p className="text-gray-500 text-sm">Postingan</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{userStats.likes}</p>
                  <p className="text-gray-500 text-sm">Likes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{Math.round((userStats.posts / userStats.totalPosts) * 100) || 0}%</p>
                  <p className="text-gray-500 text-sm">Kontribusi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Postingan Saya</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading posts...</div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Kamu belum membuat postingan apapun.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {userPosts.map((post: Post) => (
                    <PostCard
                      key={post.idPostingan}
                      post={post}
                      onLike={(postId, type) => likePostMutation.mutate({ postId, type })}
                      onDelete={(postId) => deletePostMutation.mutate(postId)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
