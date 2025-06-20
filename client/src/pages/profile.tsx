import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import { Edit, Save, X, Camera, Upload } from "lucide-react";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    nim: "",
    gender: "",
    jurusan: "",
    bio: "",
    location: "",
    website: "",
    profileImageUrl: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
    if (user) {
      setEditForm({
        username: user.username || "",
        email: user.email || "",
        nim: user.nim || "",
        gender: user.gender || "",
        jurusan: user.jurusan || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        profileImageUrl: user.profileImageUrl || "",
      });
      setProfileImage(user.profileImageUrl || null);
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

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                image: base64Data,
                fileName: file.name
              }),
            });
            
            if (!response.ok) {
              throw new Error('Gagal mengupload gambar');
            }
            
            const result = await response.json();
            resolve(result.imageUrl);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (imageUrl: string) => {
      setProfileImage(imageUrl);
      setIsUploadingImage(false);
      setSuccess("Foto profil berhasil diupload!");
      // Update form with new image URL
      setEditForm(prev => ({ ...prev, profileImageUrl: imageUrl }));
    },
    onError: (err) => {
      setIsUploadingImage(false);
      setError(err instanceof Error ? err.message : "Gagal mengupload foto");
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Ukuran file maksimal 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError("File harus berupa gambar");
        return;
      }
      
      setIsUploadingImage(true);
      setError("");
      uploadImageMutation.mutate(file);
    }
  };

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

  const genderOptions = [
    { value: "male", label: "Laki-laki" },
    { value: "female", label: "Perempuan" }
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
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-r from-primary to-secondary rounded-full border-4 border-white flex items-center justify-center relative z-10 overflow-hidden">
                      {profileImage || user.profileImageUrl ? (
                        <img 
                          src={profileImage || user.profileImageUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-4xl font-bold">
                          {user.username ? user.username.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>
                    
                    {/* Profile Image Upload Button */}
                    <Button
                      size="sm"
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full p-0 bg-white border-2 border-gray-200 hover:bg-gray-50"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-gray-600" />
                      )}
                    </Button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Username"
                          className="text-lg font-semibold"
                        />
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          type="email"
                          placeholder="Email"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            value={editForm.nim}
                            onChange={(e) => setEditForm(prev => ({ ...prev, nim: e.target.value }))}
                            placeholder="NIM"
                          />
                          <Select
                            value={editForm.gender}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, gender: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              {genderOptions.map((gender) => (
                                <SelectItem key={gender.value} value={gender.value}>
                                  {gender.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Bio (ceritakan tentang diri Anda)"
                          className="resize-none"
                          rows={3}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            value={editForm.location}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Lokasi"
                          />
                          <Input
                            value={editForm.website}
                            onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="Website/Portfolio"
                            type="url"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">{user.username}</h2>
                        <p className="text-gray-600">{user.email}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {user.nim && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-700">NIM:</span>
                              <span className="text-gray-600">{user.nim}</span>
                            </div>
                          )}
                          
                          {user.gender && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-700">Gender:</span>
                              <span className="text-gray-600 capitalize">
                                {user.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                              </span>
                            </div>
                          )}
                          
                          {user.jurusan && (
                            <div className="flex items-center space-x-2 sm:col-span-2">
                              <span className="font-medium text-gray-700">Jurusan:</span>
                              <span className="text-gray-600">{user.jurusan}</span>
                            </div>
                          )}
                        </div>

                        {user.bio && (
                          <div className="mt-3">
                            <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm">
                          {user.location && (
                            <div className="flex items-center space-x-1 text-gray-600">
                              <span>📍</span>
                              <span>{user.location}</span>
                            </div>
                          )}
                          
                          {user.website && (
                            <div className="flex items-center space-x-1">
                              <span>🔗</span>
                              <a 
                                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {user.website}
                              </a>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1 text-gray-600">
                            <span>👤</span>
                            <span className="capitalize">{user.role}</span>
                          </div>
                        </div>
                      </div>
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
                            username: user.username || "",
                            email: user.email || "",
                            nim: user.nim || "",
                            gender: user.gender || "",
                            jurusan: user.jurusan || "",
                            bio: user.bio || "",
                            location: user.location || "",
                            website: user.website || "",
                            profileImageUrl: user.profileImageUrl || "",
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
