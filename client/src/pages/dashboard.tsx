"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { ImprovedSidebar } from "@/components/sidebar";
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
} from "lucide-react";

export default function ImprovedDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const queryClient = useQueryClient();

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save sidebar state to localStorage
  const handleToggleCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  };

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
      setPostTitle("");
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
    if (!user || !postTitle.trim() || !tweetText.trim()) return;

    createPostMutation.mutate({
      judul: postTitle,
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
          <div className="bg-yellow-400 p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 animate-bounce">
            <Trophy className="text-black text-6xl mx-auto" />
          </div>
          <h1 className="text-4xl font-black text-black mb-4">SARPUS</h1>
          <p className="text-gray-600 mb-4 font-bold text-lg">
            Loading Dashboard...
          </p>
          <div className="w-64 h-3 bg-gray-200 rounded-full mx-auto border-2 border-black">
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
      const deskripsi =
        typeof post.deskripsi === "string"
          ? post.deskripsi
          : String(post.deskripsi || "");
      const judul =
        typeof post.judul === "string" ? post.judul : String(post.judul || "");
      const words = deskripsi
        .toLowerCase()
        .split(" ")
        .concat(judul.toLowerCase().split(" ") || []);
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
    .slice(0, 3)
    .map(([topic, count]) => ({ topic, count }));

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Improved Sidebar */}
      <ImprovedSidebar
        isOpen={sidebarOpen}
        onCreatePost={() => {
          const textarea = document.querySelector(
            ".tweet-input",
          ) as HTMLTextAreaElement;
          textarea?.focus();
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content - No navbar, just proper spacing from sidebar */}
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        {/* Mobile Header - Only for mobile */}
        <div className="lg:hidden bg-yellow-400 border-b-2 border-black px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
            className="bg-white border-2 border-black rounded-xl p-2 hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
          >
            <Menu className="w-4 h-4 text-black" />
          </Button>

          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Trophy className="text-black text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-black text-black">SARPUS</h1>
              <p className="text-xs text-black font-bold -mt-0.5">PLATFORM</p>
            </div>
          </div>

          <Button
            onClick={() => {
              const textarea = document.querySelector(
                ".tweet-input",
              ) as HTMLTextAreaElement;
              textarea?.focus();
            }}
            className="bg-white text-black border-2 border-black rounded-xl p-2 hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content Container with proper spacing */}
        <div className="pt-16 lg:pt-6 px-4 lg:px-8">
          <div className="flex gap-6 max-w-7xl mx-auto">
            {/* Main Timeline */}
            <div className="flex-1 max-w-2xl">
              {/* Twitter-style Compose Tweet */}
              <div
                className={`transform transition-all duration-1000 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl mb-4">
                  <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 border-b-2 border-black rounded-t-xl p-3">
                    <CardTitle className="flex items-center space-x-2 text-lg font-black text-black uppercase">
                      <MessageSquare className="w-5 h-5" />
                      <span>Buat Postingan Baru</span>
                      <Badge className="bg-white text-black border border-black font-black rounded-full text-xs px-2 py-0.5">
                        NEW
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      {/* User Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-white font-black text-base">
                          {user.username
                            ? user.username.charAt(0).toUpperCase()
                            : user.email
                              ? user.email.charAt(0).toUpperCase()
                              : "U"}
                        </span>
                      </div>

                      {/* Post Compose Area */}
                      <div className="flex-1 space-y-2">
                        {/* Title Input */}
                        <input
                          type="text"
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          placeholder="Judul postingan..."
                          className="w-full text-lg font-bold border-0 p-0 focus:ring-0 focus:border-0 placeholder:text-gray-500 bg-transparent outline-none"
                        />

                        {/* Description Textarea */}
                        <Textarea
                          value={tweetText}
                          onChange={(e) => setTweetText(e.target.value)}
                          placeholder="Apa yang terjadi di kampus?"
                          className="text-base font-medium border-0 resize-none min-h-[60px] p-0 focus:ring-0 focus:border-0 tweet-input placeholder:text-gray-500 bg-transparent"
                          rows={2}
                        />

                        {/* Image Preview */}
                        {imageUrl && (
                          <div className="mt-4 relative">
                            <img
                              src={imageUrl || "/placeholder.svg"}
                              alt="Upload preview"
                              className="w-full max-h-64 object-cover rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                            <Button
                              onClick={() => setImageUrl("")}
                              className="absolute top-2 right-2 w-6 h-6 p-0 bg-black text-white hover:bg-gray-800 rounded-full border border-white"
                            >
                              <X className="w-3 h-3" />
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
                        <div className="flex items-center justify-between pt-3 border-t-2 border-black mt-3">
                          <div className="flex items-center space-x-3">
                            {/* Character Count */}
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-gray-100 text-black border border-black font-black rounded-full text-xs px-2 py-0.5">
                                Judul: {postTitle.length}/100
                              </Badge>
                              <Badge className="bg-gray-100 text-black border border-black font-black rounded-full text-xs px-2 py-0.5">
                                Deskripsi: {tweetText.length}/280
                              </Badge>
                              {(postTitle.length > 100 ||
                                tweetText.length > 280) && (
                                <Badge className="bg-red-400 text-black border border-black font-black rounded-full text-xs animate-pulse px-2 py-0.5">
                                  Terlalu Panjang!
                                </Badge>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1">
                              <Button
                                onClick={() =>
                                  setShowImageUpload(!showImageUpload)
                                }
                                variant="ghost"
                                className="text-cyan-500 hover:bg-cyan-50 p-1.5 rounded-full w-8 h-8 border border-transparent hover:border-cyan-500 transition-all duration-300"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                className="text-cyan-500 hover:bg-cyan-50 p-1.5 rounded-full w-8 h-8 border border-transparent hover:border-cyan-500 transition-all duration-300"
                              >
                                <Smile className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                className="text-cyan-500 hover:bg-cyan-50 p-1.5 rounded-full w-8 h-8 border border-transparent hover:border-cyan-500 transition-all duration-300"
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                className="text-cyan-500 hover:bg-cyan-50 p-1.5 rounded-full w-8 h-8 border border-transparent hover:border-cyan-500 transition-all duration-300"
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Tweet Button */}
                          <Button
                            className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-full px-6 py-2 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center space-x-2 group"
                            onClick={handleTweet}
                            disabled={
                              createPostMutation.isPending ||
                              !postTitle.trim() ||
                              !tweetText.trim() ||
                              postTitle.length > 100 ||
                              tweetText.length > 280
                            }
                          >
                            {createPostMutation.isPending ? (
                              <>
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">POSTING...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm">POST</span>
                                <Send className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feed */}
              <div
                className={`transform transition-all duration-1000 delay-300 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                {isLoading ? (
                  <div className="text-center py-12 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 animate-bounce inline-block">
                      <MessageSquare className="text-black text-4xl" />
                    </div>
                    <h3 className="text-2xl font-black text-black mb-3 uppercase">
                      Loading Timeline...
                    </h3>
                    <p className="text-base font-bold text-gray-600">
                      Mengambil postingan terbaru
                    </p>
                  </div>
                ) : !posts || posts.length === 0 ? (
                  <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
                    <CardContent className="p-8 text-center">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 inline-block">
                        <MessageSquare className="text-black text-4xl" />
                      </div>
                      <h3 className="text-2xl font-black text-black mb-3 uppercase">
                        Timeline Kosong
                      </h3>
                      <p className="text-base font-bold text-gray-600 mb-6">
                        Jadilah yang pertama posting hari ini!
                      </p>
                      <Button
                        className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-xl px-6 py-3 font-black text-base shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                        onClick={() => {
                          const textarea = document.querySelector(
                            ".tweet-input",
                          ) as HTMLTextAreaElement;
                          textarea?.focus();
                          window.scrollTo(0, 0);
                        }}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        BUAT POST PERTAMA
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-0 divide-y-2 divide-black">
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

            {/* Right Sidebar - Trending Topics */}
            <div
              className={`hidden xl:block w-80 transform transition-all duration-1000 delay-500 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="sticky top-6">
                <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
                  <CardHeader className="bg-pink-400 border-b-2 border-black rounded-t-xl p-3">
                    <CardTitle className="flex items-center space-x-2 text-lg font-black text-black uppercase">
                      <TrendingUp className="w-4 h-4" />
                      <span>Trending Topics</span>
                      <Badge className="bg-white text-black border border-black font-black rounded-full text-xs px-2 py-0.5">
                        HOT
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {topTrending.length > 0 ? (
                        topTrending.map(({ topic, count }, index) => (
                          <div
                            key={topic}
                            className="bg-gray-50 hover:bg-pink-400 p-2.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center border border-black font-black text-xs">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-sm capitalize text-black group-hover:text-black flex items-center truncate">
                                    <Hash className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{topic}</span>
                                  </p>
                                  <p className="text-gray-600 text-xs font-bold">
                                    {count} postingan
                                  </p>
                                </div>
                              </div>
                              <Fire className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Hash className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 font-bold text-xs">
                            Belum ada trending topics
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
