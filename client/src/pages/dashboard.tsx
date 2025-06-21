"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import {
  Plus,
  Menu,
  RefreshCw,
  Trophy,
  ImageIcon,
  Smile,
  Calendar,
  MapPin,
  X,
  Send,
  MessageSquare,
  TrendingUp,
  Hash,
  FlameIcon as Fire,
  Users,
  Heart,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [tweetText, setTweetText] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

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
        judul: "",
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
      setTweetText("");
      setImageUrl("");
      setShowImageUpload(false);
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
        return old.filter((post: any) => post.idPostingan !== postId);
      });

      const deletedPosts = JSON.parse(
        localStorage.getItem("deletedPosts") || "[]",
      );
      if (!deletedPosts.includes(postId)) {
        deletedPosts.push(postId);
        localStorage.setItem("deletedPosts", JSON.stringify(deletedPosts));
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
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return api.uploadImage(file);
    },
    onSuccess: (data: any) => {
      if (data.imageUrl && data.imageUrl.trim() !== "") {
        setImageUrl(data.imageUrl);
      }
    },
    onError: (error) => {
      console.error("Image upload failed:", error);
    },
  });

  const handleTweet = () => {
    if (!user || !tweetText.trim()) return;

    createPostMutation.mutate({
      judul: "",
      deskripsi: tweetText,
      imageUrl: imageUrl,
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
          <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce">
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

  // Calculate trending topics from posts
  const typedPosts = posts as Post[];
  const trendingTopics = typedPosts.reduce(
    (topics: { [key: string]: number }, post: Post) => {
      const words = post.deskripsi
        .toLowerCase()
        .split(" ")
        .concat(post.judul?.toLowerCase().split(" ") || []);
      words.forEach((word) => {
        if (
          word.length > 4 &&
          ![
            "yang",
            "dengan",
            "untuk",
            "adalah",
            "akan",
            "dari",
            "pada",
            "dalam",
            "tidak",
            "juga",
            "sudah",
          ].includes(word)
        ) {
          topics[word] = (topics[word] || 0) + 1;
        }
      });
      return topics;
    },
    {},
  );

  const topTrending = Object.entries(trendingTopics)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  // Calculate stats
  const stats = {
    totalPosts: typedPosts.length,
    totalLikes: typedPosts.reduce(
      (sum: number, post: Post) => sum + (post.likes || 0),
      0,
    ),
    todayPosts: typedPosts.filter(
      (post: Post) =>
        new Date(post.timestamp).toDateString() === new Date().toDateString(),
    ).length,
    activeUsers: new Set(typedPosts.map((post: Post) => post.username)).size,
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCreatePost={() => {
          const textarea = document.querySelector(
            ".tweet-input",
          ) as HTMLTextAreaElement;
          textarea?.focus();
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:ml-80 transition-all duration-300">
        {/* Mobile Header - Changed to Yellow */}
        <div className="lg:hidden bg-yellow-400 border-b-4 border-black px-6 py-4 flex items-center justify-between sticky top-0 z-30">
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
              <h1 className="text-xl font-black text-black">BERANDA</h1>
              <p className="text-xs text-black font-bold -mt-1">
                Timeline SARPUS
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              const textarea = document.querySelector(
                ".tweet-input",
              ) as HTMLTextAreaElement;
              textarea?.focus();
            }}
            className="bg-white text-black border-4 border-black rounded-2xl p-3 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* 3-Column Layout */}
        <div className="flex max-w-7xl mx-auto">
          {/* Main Timeline - Center Column */}
          <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
            {/* Desktop Header - Changed to Yellow */}
            <div className="hidden lg:block bg-yellow-400 border-b-4 border-black sticky top-0 z-20">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Trophy className="text-black text-2xl" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black text-black uppercase">
                        BERANDA
                      </h1>
                      <p className="text-lg font-bold text-black">
                        Timeline SARPUS
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => refetchPosts()}
                    className="bg-white text-black hover:bg-gray-100 border-4 border-black rounded-2xl p-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Twitter-style Compose Tweet */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <Card className="border-4 border-black shadow-none bg-white rounded-none border-t-0">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-white font-black text-lg">
                        {user.username
                          ? user.username.charAt(0).toUpperCase()
                          : user.email
                            ? user.email.charAt(0).toUpperCase()
                            : "U"}
                      </span>
                    </div>

                    {/* Tweet Compose Area */}
                    <div className="flex-1">
                      <Textarea
                        value={tweetText}
                        onChange={(e) => setTweetText(e.target.value)}
                        placeholder="Apa yang terjadi di kampus?"
                        className="text-xl font-bold border-0 resize-none min-h-[80px] p-0 focus:ring-0 focus:border-0 tweet-input placeholder:text-gray-500 bg-transparent"
                        rows={3}
                      />

                      {/* Image Preview */}
                      {imageUrl && (
                        <div className="mt-4 relative">
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt="Upload preview"
                            className="w-full max-h-64 object-cover rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          />
                          <Button
                            onClick={() => setImageUrl("")}
                            className="absolute top-2 right-2 w-8 h-8 p-0 bg-black text-white hover:bg-gray-800 rounded-full border-2 border-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Image Upload Component */}
                      {showImageUpload && (
                        <div className="mt-4">
                          <ImageUploadWithPreview
                            onImageUpload={handleImageUpload}
                            onImageRemove={() => setImageUrl("")}
                            imageUrl={imageUrl}
                            isUploading={uploadImageMutation.isPending}
                            disabled={createPostMutation.isPending}
                          />
                        </div>
                      )}

                      {/* Character Count and Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                        <div className="flex items-center space-x-4">
                          {/* Character Count */}
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-bold text-gray-600">
                              {tweetText.length}/280
                            </span>
                            {tweetText.length > 280 && (
                              <Badge className="bg-red-400 text-black border-2 border-black font-black rounded-full text-xs">
                                Terlalu Panjang!
                              </Badge>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() =>
                                setShowImageUpload(!showImageUpload)
                              }
                              variant="ghost"
                              className="text-cyan-500 hover:bg-cyan-50 p-2 rounded-full w-10 h-10"
                            >
                              <ImageIcon className="w-5 h-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              className="text-cyan-500 hover:bg-cyan-50 p-2 rounded-full w-10 h-10"
                            >
                              <Smile className="w-5 h-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              className="text-cyan-500 hover:bg-cyan-50 p-2 rounded-full w-10 h-10"
                            >
                              <MapPin className="w-5 h-5" />
                            </Button>

                            <Button
                              variant="ghost"
                              className="text-cyan-500 hover:bg-cyan-50 p-2 rounded-full w-10 h-10"
                            >
                              <Calendar className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        {/* Tweet Button */}
                        <Button
                          className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-full px-8 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center space-x-2 group"
                          onClick={handleTweet}
                          disabled={
                            createPostMutation.isPending ||
                            !tweetText.trim() ||
                            tweetText.length > 280
                          }
                        >
                          {createPostMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-4 border-black border-t-transparent rounded-full animate-spin" />
                              <span>POSTING...</span>
                            </>
                          ) : (
                            <>
                              <span>POST</span>
                              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Twitter-style Feed */}
            <div
              className={`transform transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              {isLoading ? (
                <div className="text-center py-16 bg-white border-4 border-black border-t-0">
                  <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce inline-block">
                    <MessageSquare className="text-black text-6xl" />
                  </div>
                  <h3 className="text-3xl font-black text-black mb-4 uppercase">
                    Loading Timeline...
                  </h3>
                  <p className="text-lg font-bold text-gray-600">
                    Mengambil postingan terbaru
                  </p>
                </div>
              ) : !posts || posts.length === 0 ? (
                <Card className="border-4 border-black shadow-none bg-white rounded-none border-t-0">
                  <CardContent className="p-12 text-center">
                    <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 inline-block">
                      <MessageSquare className="text-black text-6xl" />
                    </div>
                    <h3 className="text-3xl font-black text-black mb-4 uppercase">
                      Timeline Kosong
                    </h3>
                    <p className="text-lg font-bold text-gray-600 mb-8">
                      Jadilah yang pertama posting hari ini!
                    </p>
                    <Button
                      className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-8 py-4 font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        const textarea = document.querySelector(
                          ".tweet-input",
                        ) as HTMLTextAreaElement;
                        textarea?.focus();
                        window.scrollTo(0, 0);
                      }}
                    >
                      <Plus className="w-6 h-6 mr-3" />
                      BUAT POST PERTAMA
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="divide-y-4 divide-black">
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
                          onDelete={(postId) =>
                            deletePostMutation.mutate(postId)
                          }
                        />
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Trending Topics (Desktop Only) */}
          <div
            className={`hidden xl:block w-80 ml-8 transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="sticky top-6 space-y-6">
              {/* Trending Topics Card */}
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
                <CardHeader className="bg-pink-400 border-b-4 border-black rounded-t-2xl">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                    <TrendingUp className="w-6 h-6" />
                    <span>Trending Topics</span>
                    <Badge className="bg-white text-black border-2 border-black font-black rounded-full">
                      HOT
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {topTrending.length > 0 ? (
                      topTrending.map(({ topic, count }, index) => (
                        <div
                          key={topic}
                          className="bg-gray-50 hover:bg-pink-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-black font-black text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-black text-lg capitalize text-black group-hover:text-black flex items-center">
                                  <Hash className="w-4 h-4 mr-1" />
                                  {topic}
                                </p>
                                <p className="text-gray-600 text-sm font-bold">
                                  {count} postingan
                                </p>
                              </div>
                            </div>
                            <Fire className="w-5 h-5 text-orange-500" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-bold">
                          Belum ada trending topics
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
                <CardHeader className="bg-green-400 border-b-4 border-black rounded-t-2xl">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                    <BarChart3 className="w-6 h-6" />
                    <span>Statistik Hari Ini</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-yellow-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                      <div>
                        <span className="text-black font-bold text-sm uppercase">
                          Total Posts
                        </span>
                        <div className="text-2xl font-black text-black">
                          {stats.totalPosts}
                        </div>
                      </div>
                      <MessageSquare className="w-6 h-6 text-black" />
                    </div>

                    <div className="bg-pink-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                      <div>
                        <span className="text-black font-bold text-sm uppercase">
                          Total Likes
                        </span>
                        <div className="text-2xl font-black text-black">
                          {stats.totalLikes}
                        </div>
                      </div>
                      <Heart className="w-6 h-6 text-black" />
                    </div>

                    <div className="bg-cyan-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                      <div>
                        <span className="text-black font-bold text-sm uppercase">
                          Hari Ini
                        </span>
                        <div className="text-2xl font-black text-black">
                          +{stats.todayPosts}
                        </div>
                      </div>
                      <TrendingUp className="w-6 h-6 text-black" />
                    </div>

                    <div className="bg-purple-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                      <div>
                        <span className="text-black font-bold text-sm uppercase">
                          Active Users
                        </span>
                        <div className="text-2xl font-black text-black">
                          {stats.activeUsers}
                        </div>
                      </div>
                      <Users className="w-6 h-6 text-black" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
