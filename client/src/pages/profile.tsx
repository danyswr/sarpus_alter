"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import {
  Edit,
  Save,
  X,
  Camera,
  Trophy,
  User,
  GraduationCap,
  BookOpen,
  MapPin,
  Globe,
  Heart,
  MessageSquare,
  Target,
  Crown,
  Star,
  Menu,
  Plus,
} from "lucide-react";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
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

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

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
  }) as { data: Post[]; isLoading: boolean };

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof editForm) =>
      api.user.updateProfile(user!.idUsers, data),
    onSuccess: () => {
      setSuccess("Profil berhasil diperbarui!");
      setIsEditing(false);
      setError("");
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
            const base64Data = base64.split(",")[1];

            const response = await fetch("/api/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                image: base64Data,
                fileName: file.name,
              }),
            });

            if (!response.ok) {
              throw new Error("Gagal mengupload gambar");
            }

            const result = await response.json();
            resolve(result.imageUrl);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Gagal membaca file"));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (imageUrl: string) => {
      setProfileImage(imageUrl);
      setIsUploadingImage(false);
      setSuccess("Foto profil berhasil diupload!");
      setEditForm((prev) => ({ ...prev, profileImageUrl: imageUrl }));
    },
    onError: (err) => {
      setIsUploadingImage(false);
      setError(err instanceof Error ? err.message : "Gagal mengupload foto");
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      setIsUploadingImage(true);
      setError("");
      uploadImageMutation.mutate(file);
    }
  };

  const likePostMutation = useMutation({
    mutationFn: ({
      postId,
      type,
    }: {
      postId: string;
      type: "like" | "dislike";
    }) => api.posts.likePost(postId, type),
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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce">
            <User className="text-black text-8xl mx-auto" />
          </div>
          <h1 className="text-6xl font-black text-black mb-4">SARPUS</h1>
          <p className="text-gray-600 mb-6 font-bold text-xl">
            Loading Profile...
          </p>
          <div className="w-80 h-4 bg-gray-200 rounded-full mx-auto border-4 border-black">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const userPosts = posts.filter((post: Post) => post.idUsers === user.idUsers);
  const userStats = {
    posts: userPosts.length,
    likes: userPosts.reduce(
      (sum: number, post: Post) => sum + (post.likes || 0),
      0,
    ),
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
    "Kedokteran",
  ];

  const genderOptions = [
    { value: "male", label: "Laki-laki" },
    { value: "female", label: "Perempuan" },
  ];

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreatePost={() => {
          setLocation("/dashboard");
        }}
      />

      <div className="lg:ml-80 transition-all duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden bg-cyan-400 border-b-4 border-black px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
            className="bg-white border-4 border-black rounded-2xl p-3 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Menu className="w-5 h-5 text-black" />
          </Button>

          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-xl border-2 border-black">
              <User className="text-black text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">PROFIL</h1>
              <p className="text-xs text-black font-bold -mt-1">USER PROFILE</p>
            </div>
          </div>

          <div className="w-12"></div>
        </div>

        <div className="max-w-6xl mx-auto py-8 px-6">
          {/* Alerts */}
          {error && (
            <Alert className="mb-8 border-4 border-red-500 bg-red-100 rounded-xl">
              <AlertDescription className="text-red-700 font-bold text-lg">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-8 border-4 border-green-500 bg-green-100 rounded-xl">
              <AlertDescription className="text-green-700 font-bold text-lg">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Header */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl overflow-hidden">
              {/* Cover Photo */}
              <div className="h-48 bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-400 relative border-b-4 border-black">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-4 left-8 flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Trophy className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white">
                      PROFIL MAHASISWA
                    </h1>
                    <p className="text-lg font-bold text-white">
                      SARPUS Community Member
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="px-8 pb-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between -mt-16 relative">
                  <div className="flex flex-col lg:flex-row lg:items-end space-y-6 lg:space-y-0 lg:space-x-6">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-4 border-black flex items-center justify-center relative z-10 overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        {profileImage || user.profileImageUrl ? (
                          <img
                            src={profileImage || user.profileImageUrl}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-4xl font-black">
                            {user.username
                              ? user.username.charAt(0).toUpperCase()
                              : user.email
                                ? user.email.charAt(0).toUpperCase()
                                : "U"}
                          </span>
                        )}
                      </div>

                      {/* Profile Image Upload Button */}
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 w-12 h-12 rounded-full p-0 bg-yellow-400 border-4 border-black hover:bg-yellow-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-black" />
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

                    <div className="text-center lg:text-left">
                      {isEditing ? (
                        <div className="space-y-4">
                          <Input
                            value={editForm.username}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                username: e.target.value,
                              }))
                            }
                            placeholder="Username"
                            className="text-xl font-black border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                          />
                          <Input
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            type="email"
                            placeholder="Email"
                            className="text-lg font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                          />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Input
                              value={editForm.nim}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  nim: e.target.value,
                                }))
                              }
                              placeholder="NIM"
                              className="font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                            />
                            <Select
                              value={editForm.gender}
                              onValueChange={(value) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  gender: value,
                                }))
                              }
                            >
                              <SelectTrigger className="font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3">
                                <SelectValue placeholder="Pilih Gender" />
                              </SelectTrigger>
                              <SelectContent>
                                {genderOptions.map((gender) => (
                                  <SelectItem
                                    key={gender.value}
                                    value={gender.value}
                                  >
                                    {gender.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Select
                            value={editForm.jurusan}
                            onValueChange={(value) =>
                              setEditForm((prev) => ({
                                ...prev,
                                jurusan: value,
                              }))
                            }
                          >
                            <SelectTrigger className="font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3">
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
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                bio: e.target.value,
                              }))
                            }
                            placeholder="Bio (ceritakan tentang diri Anda)"
                            className="font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3 resize-none"
                            rows={3}
                          />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Input
                              value={editForm.location}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                              placeholder="Lokasi"
                              className="font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                            />
                            <Input
                              value={editForm.website}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  website: e.target.value,
                                }))
                              }
                              placeholder="Website/Portfolio"
                              type="url"
                              className="font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <h2 className="text-4xl font-black text-black">
                              {user.username}
                            </h2>
                            {user.role === "admin" && (
                              <Badge className="bg-red-400 text-black border-2 border-black font-black rounded-full">
                                <Crown className="w-4 h-4 mr-1" />
                                ADMIN
                              </Badge>
                            )}
                          </div>
                          <p className="text-xl font-bold text-gray-600">
                            {user.email}
                          </p>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-lg">
                            {user.nim && (
                              <div className="bg-yellow-400 p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-3">
                                <GraduationCap className="w-5 h-5 text-black" />
                                <div>
                                  <span className="font-black text-black uppercase text-sm">
                                    NIM
                                  </span>
                                  <div className="font-bold text-black">
                                    {user.nim}
                                  </div>
                                </div>
                              </div>
                            )}

                            {user.gender && (
                              <div className="bg-pink-400 p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-3">
                                <User className="w-5 h-5 text-black" />
                                <div>
                                  <span className="font-black text-black uppercase text-sm">
                                    Gender
                                  </span>
                                  <div className="font-bold text-black capitalize">
                                    {user.gender === "male"
                                      ? "Laki-laki"
                                      : "Perempuan"}
                                  </div>
                                </div>
                              </div>
                            )}

                            {user.jurusan && (
                              <div className="bg-green-400 p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-3 lg:col-span-2">
                                <BookOpen className="w-5 h-5 text-black" />
                                <div>
                                  <span className="font-black text-black uppercase text-sm">
                                    Jurusan
                                  </span>
                                  <div className="font-bold text-black">
                                    {user.jurusan}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {user.bio && (
                            <div className="bg-cyan-400 p-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <span className="font-black text-black uppercase text-sm block mb-2">
                                Bio
                              </span>
                              <p className="text-black font-bold leading-relaxed">
                                {user.bio}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-4">
                            {user.location && (
                              <div className="bg-purple-400 p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-2">
                                <MapPin className="w-5 h-5 text-black" />
                                <span className="font-bold text-black">
                                  {user.location}
                                </span>
                              </div>
                            )}

                            {user.website && (
                              <div className="bg-orange-400 p-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-2">
                                <Globe className="w-5 h-5 text-black" />
                                <a
                                  href={
                                    user.website.startsWith("http")
                                      ? user.website
                                      : `https://${user.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-black hover:underline"
                                >
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-6 lg:mt-0">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-6 py-3 font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                          disabled={updateProfileMutation.isPending}
                        >
                          <Save className="w-5 h-5 mr-2" />
                          {updateProfileMutation.isPending
                            ? "MENYIMPAN..."
                            : "SIMPAN"}
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
                          className="border-4 border-black text-black bg-white hover:bg-gray-100 rounded-2xl px-6 py-3 font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                        >
                          <X className="w-5 h-5 mr-2" />
                          BATAL
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-6 py-3 font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                      >
                        <Edit className="w-5 h-5 mr-2" />
                        EDIT PROFIL
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t-4 border-black">
                  <div className="bg-yellow-400 p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 text-black" />
                    <p className="text-3xl font-black text-black">
                      {userStats.posts}
                    </p>
                    <p className="text-black font-bold text-sm uppercase">
                      Postingan
                    </p>
                  </div>
                  <div className="bg-pink-400 p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
                    <Heart className="w-8 h-8 mx-auto mb-3 text-black" />
                    <p className="text-3xl font-black text-black">
                      {userStats.likes}
                    </p>
                    <p className="text-black font-bold text-sm uppercase">
                      Likes
                    </p>
                  </div>
                  <div className="bg-green-400 p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
                    <Star className="w-8 h-8 mx-auto mb-3 text-black" />
                    <p className="text-3xl font-black text-black">
                      {Math.round(
                        (userStats.posts / userStats.totalPosts) * 100,
                      ) || 0}
                      %
                    </p>
                    <p className="text-black font-bold text-sm uppercase">
                      Kontribusi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Posts */}
          <div
            className={`transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardHeader className="bg-pink-400 border-b-4 border-black rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                  <Target className="w-6 h-6" />
                  <span>Postingan Saya</span>
                  <Badge className="bg-white text-black border-2 border-black font-black rounded-full">
                    {userPosts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {isLoading ? (
                  <div className="text-center py-16">
                    <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce inline-block">
                      <MessageSquare className="text-black text-6xl" />
                    </div>
                    <h3 className="text-3xl font-black text-black mb-4">
                      LOADING POSTS...
                    </h3>
                    <p className="text-lg font-bold text-gray-600">
                      Mengambil postingan Anda
                    </p>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 inline-block">
                      <MessageSquare className="text-black text-6xl" />
                    </div>
                    <h3 className="text-3xl font-black text-black mb-4 uppercase">
                      Belum Ada Postingan
                    </h3>
                    <p className="text-lg font-bold text-gray-600 mb-8">
                      Mulai berbagi keluh kesah dan aspirasi Anda dengan
                      komunitas!
                    </p>
                    <Button
                      onClick={() => setLocation("/dashboard")}
                      className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-8 py-4 font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="w-6 h-6 mr-3" />
                      BUAT POSTINGAN PERTAMA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userPosts.map((post: Post) => (
                      <PostCard
                        key={post.idPostingan}
                        post={post}
                        onLike={(postId, type) =>
                          likePostMutation.mutate({ postId, type })
                        }
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
    </div>
  );
}
