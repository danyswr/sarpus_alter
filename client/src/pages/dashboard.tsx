"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { PostCard } from "@/components/post-card";
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import {
  Plus,
  Menu,
  RefreshCw,
  Trophy,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Heart,
  Zap,
  Target,
} from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [newPost, setNewPost] = useState({
    judul: "",
    deskripsi: "",
    imageUrl: "",
  });
  const queryClient = useQueryClient();

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const {
    data: posts = [],
    isLoading,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["google-posts"],
    queryFn: async () => {
      const fetchedPosts = await api.posts.getAllPosts();
      const deletedPosts = JSON.parse(
        localStorage.getItem("deletedPosts") || "[]",
      );
      const filteredPosts = fetchedPosts.filter(
        (post: any) => !deletedPosts.includes(post.idPostingan),
      );
      console.log(
        `Filtered out ${fetchedPosts.length - filteredPosts.length} deleted posts`,
      );
      return filteredPosts;
    },
    enabled: !!user,
    refetchInterval: 3000,
    staleTime: 1000,
    refetchOnWindowFocus: true,
  }) as { data: Post[]; isLoading: boolean; refetch: () => void };

  const createPostMutation = useMutation({
    mutationFn: (data: {
      judul: string;
      deskripsi: string;
      imageUrl?: string;
      userId: string;
    }) => api.posts.createPost(data),
    onMutate: async (newPostData) => {
      await queryClient.cancelQueries({ queryKey: ["google-posts"] });

      const previousPosts = queryClient.getQueryData<Post[]>(["google-posts"]);

      const optimisticPost: Post = {
        idPostingan: `TEMP_${Date.now()}`,
        idUsers: user!.idUsers,
        username: user!.username,
        timestamp: new Date(),
        judul: newPostData.judul,
        deskripsi: newPostData.deskripsi,
        like: 0,
        dislike: 0,
        imageUrl: newPostData.imageUrl || "",
      };

      queryClient.setQueryData<Post[]>(["google-posts"], (old) =>
        old ? [optimisticPost, ...old] : [optimisticPost],
      );

      return { previousPosts };
    },
    onError: (err, newPostData, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["google-posts"], context.previousPosts);
      }
    },
    onSuccess: () => {
      setNewPost({ judul: "", deskripsi: "", imageUrl: "" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["google-posts"] });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: ({
      postId,
      type,
    }: {
      postId: string;
      type: "like" | "dislike";
    }) => api.posts.likePost(postId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-posts"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["google-posts"] });

      const deletedPosts = JSON.parse(
        localStorage.getItem("deletedPosts") || "[]",
      );
      if (!deletedPosts.includes(postId)) {
        deletedPosts.push(postId);
        localStorage.setItem("deletedPosts", JSON.stringify(deletedPosts));
        console.log(`Pre-emptively added ${postId} to deleted posts list`);
      }

      const previousPosts = queryClient.getQueryData(["google-posts"]);
      queryClient.setQueryData(["google-posts"], (old: any) => {
        if (!old) return old;
        return old.filter((post: any) => post.idPostingan !== postId);
      });

      return { previousPosts };
    },
    onSuccess: (data, postId) => {
      queryClient.setQueryData(["google-posts"], (old: any) => {
        if (!old) return old;
        const filtered = old.filter((post: any) => post.idPostingan !== postId);
        console.log(
          `Post ${postId} permanently removed. Remaining posts:`,
          filtered.length,
        );
        return filtered;
      });

      const deletedPosts = JSON.parse(
        localStorage.getItem("deletedPosts") || "[]",
      );
      if (!deletedPosts.includes(postId)) {
        deletedPosts.push(postId);
        localStorage.setItem("deletedPosts", JSON.stringify(deletedPosts));
        console.log(`Added ${postId} to deleted posts list:`, deletedPosts);
      }
    },
    onError: (err, postId, context) => {
      const deletedPosts = JSON.parse(
        localStorage.getItem("deletedPosts") || "[]",
      );
      const updatedDeleted = deletedPosts.filter((id: string) => id !== postId);
      localStorage.setItem("deletedPosts", JSON.stringify(updatedDeleted));

      if (context?.previousPosts) {
        queryClient.setQueryData(["google-posts"], context.previousPosts);
      }
      console.error("Delete failed:", err);
    },
    onSettled: (data, error, postId) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: ["google-posts"] });
      } else {
        console.log(`Post ${postId} deletion completed successfully`);
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
        setNewPost((prev) => ({ ...prev, imageUrl: data.imageUrl }));
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
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce">
            <Trophy className="text-black text-8xl mx-auto" />
          </div>
          <h1 className="text-6xl font-black text-black mb-4">SARPUS</h1>
          <p className="text-gray-600 mb-6 font-bold text-xl">
            Loading Dashboard...
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

  const quickStats = [
    {
      number: posts.length,
      label: "Total Posts",
      icon: MessageSquare,
      color: "bg-yellow-400",
    },
    {
      number: posts.reduce((acc, post) => acc + (post.like || 0), 0),
      label: "Total Likes",
      icon: Heart,
      color: "bg-pink-400",
    },
    {
      number: "98%",
      label: "Engagement",
      icon: TrendingUp,
      color: "bg-green-400",
    },
    { number: "24/7", label: "Active", icon: Zap, color: "bg-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCreatePost={() => {
          const textarea = document.querySelector(
            ".mobile-post-input",
          ) as HTMLTextAreaElement;
          textarea?.focus();
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
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
              <Trophy className="text-black text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">SARPUS</h1>
              <p className="text-xs text-black font-bold -mt-1">DASHBOARD</p>
            </div>
          </div>

          <Button
            onClick={() => {
              const textarea = document.querySelector(
                ".mobile-post-input",
              ) as HTMLTextAreaElement;
              textarea?.focus();
            }}
            className="bg-yellow-400 text-black border-4 border-black rounded-2xl p-3 hover:bg-yellow-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Welcome Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="bg-cyan-400 p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Trophy className="text-black text-3xl" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black mb-2">
                    WELCOME BACK!
                  </h1>
                  <p className="text-xl font-bold text-black">
                    Halo,{" "}
                    <span className="bg-yellow-400 px-3 py-1 rounded-xl border-2 border-black">
                      {user.username || user.email}
                    </span>
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center space-x-3 bg-white text-black px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Sparkles className="w-5 h-5" />
                <span className="font-black text-lg uppercase tracking-wide">
                  DASHBOARD MAHASISWA
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className={`${stat.color} p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group`}
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-black group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-3xl font-black text-black mb-2 text-center">
                    {stat.number}
                  </div>
                  <div className="text-sm text-black font-bold uppercase text-center">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Post Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardHeader className="bg-yellow-400 border-b-4 border-black rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                  <Target className="w-6 h-6" />
                  <span>Buat Postingan Baru</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-white font-black text-2xl">
                      {user.username
                        ? user.username.charAt(0).toUpperCase()
                        : user.email
                          ? user.email.charAt(0).toUpperCase()
                          : "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-6">
                      {/* Judul Input */}
                      <div>
                        <label className="block text-lg font-black text-black mb-3 uppercase tracking-wide">
                          Judul Keluh Kesah
                        </label>
                        <Input
                          value={newPost.judul}
                          onChange={(e) =>
                            setNewPost((prev) => ({
                              ...prev,
                              judul: e.target.value,
                            }))
                          }
                          placeholder="Berikan judul yang menarik..."
                          className="text-lg font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                        />
                      </div>

                      {/* Deskripsi Textarea */}
                      <div>
                        <label className="block text-lg font-black text-black mb-3 uppercase tracking-wide">
                          Ceritakan Keluh Kesahmu
                        </label>
                        <Textarea
                          value={newPost.deskripsi}
                          onChange={(e) =>
                            setNewPost((prev) => ({
                              ...prev,
                              deskripsi: e.target.value,
                            }))
                          }
                          placeholder="Apa yang terjadi di kampus? Ceritakan pengalamanmu..."
                          className="text-lg font-bold border-4 border-black rounded-xl focus:border-cyan-400 px-4 py-3 resize-none min-h-[120px] mobile-post-input"
                          rows={4}
                        />
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-sm font-bold text-gray-600">
                            {newPost.deskripsi.length}/280 karakter
                          </span>
                          {newPost.deskripsi.length > 280 && (
                            <Badge className="bg-red-400 text-black border-2 border-black font-black">
                              Terlalu Panjang!
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Image Upload Component */}
                      <div>
                        <label className="block text-lg font-black text-black mb-3 uppercase tracking-wide">
                          Tambah Gambar (Opsional)
                        </label>
                        <ImageUploadWithPreview
                          onImageUpload={handleImageUpload}
                          onImageRemove={() =>
                            setNewPost((prev) => ({ ...prev, imageUrl: "" }))
                          }
                          imageUrl={newPost.imageUrl}
                          isUploading={uploadImageMutation.isPending}
                          disabled={createPostMutation.isPending}
                        />
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-8 border-t-4 border-black mt-8">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          onClick={() => refetchPosts()}
                          className="border-4 border-black text-black bg-white hover:bg-gray-100 rounded-2xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                        >
                          <RefreshCw className="w-5 h-5 mr-2" />
                          Refresh Feed
                        </Button>
                      </div>

                      <Button
                        className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-8 py-3 font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center space-x-3 group"
                        onClick={handleCreatePost}
                        disabled={
                          createPostMutation.isPending ||
                          !newPost.deskripsi.trim() ||
                          newPost.deskripsi.length > 280
                        }
                      >
                        {createPostMutation.isPending ? (
                          <>
                            <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            <span>POSTING...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>POSTING SEKARANG</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts Feed Section */}
          <div
            className={`transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-pink-400 p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <MessageSquare className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-black uppercase">
                    Feed Keluh Kesah
                  </h2>
                  <p className="text-lg font-bold text-gray-600">
                    Suara mahasiswa dari seluruh Indonesia
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => refetchPosts()}
                disabled={isLoading}
                className="border-4 border-black text-black bg-white hover:bg-gray-100 rounded-2xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce inline-block">
                  <MessageSquare className="text-black text-6xl" />
                </div>
                <h3 className="text-3xl font-black text-black mb-4">
                  LOADING POSTS...
                </h3>
                <p className="text-lg font-bold text-gray-600">
                  Mengambil keluh kesah terbaru
                </p>
              </div>
            ) : !posts || posts.length === 0 ? (
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 inline-block">
                    <Plus className="text-black text-6xl" />
                  </div>
                  <h3 className="text-3xl font-black text-black mb-4 uppercase">
                    Belum Ada Postingan
                  </h3>
                  <p className="text-lg font-bold text-gray-600 mb-8">
                    Jadilah yang pertama menyuarakan aspirasi!
                  </p>
                  <Button
                    className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-8 py-4 font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <Plus className="w-6 h-6 mr-3" />
                    BUAT POSTINGAN PERTAMA
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {(posts as Post[])
                  .filter((post: Post) => {
                    const deletedPosts = JSON.parse(
                      localStorage.getItem("deletedPosts") || "[]",
                    );
                    return !deletedPosts.includes(post.idPostingan);
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.timestamp).getTime();
                    const dateB = new Date(b.timestamp).getTime();

                    if (
                      isNaN(dateA) ||
                      isNaN(dateB) ||
                      Math.abs(dateA - dateB) < 1000
                    ) {
                      const idA = Number.parseInt(
                        (a.idPostingan || "0").replace(/\D/g, "") || "0",
                      );
                      const idB = Number.parseInt(
                        (b.idPostingan || "0").replace(/\D/g, "") || "0",
                      );
                      return idB - idA;
                    }

                    return dateB - dateA;
                  })
                  .map((post: Post, index: number) => {
                    console.log(`Rendering post ${post.idPostingan}:`, post);
                    const baseId = post.idPostingan || `temp-${index}`;
                    const timestamp = post.timestamp
                      ? new Date(post.timestamp).getTime()
                      : Date.now() + index;
                    const content = (post.judul + post.deskripsi)
                      .slice(0, 10)
                      .replace(/\s/g, "");
                    const uniqueKey = `${baseId}-${timestamp}-${content}-${index}`;

                    return (
                      <PostCard
                        key={uniqueKey}
                        post={post}
                        onLike={(postId, type) =>
                          likePostMutation.mutate({ postId, type })
                        }
                        onDelete={(postId) => deletePostMutation.mutate(postId)}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
