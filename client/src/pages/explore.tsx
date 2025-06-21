"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import {
  Search,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  MessageSquare,
  Heart,
  Users,
  Globe,
  RefreshCw,
  Filter,
  BarChart3,
} from "lucide-react";

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["google-posts-explore"],
    queryFn: () => api.posts.getAllPosts(),
    refetchInterval: 10000,
  });

  const likePostMutation = useMutation({
    mutationFn: ({
      postId,
      type,
    }: {
      postId: string;
      type: "like" | "dislike";
    }) => api.posts.likePost(postId, type),
    onMutate: async ({ postId, type }) => {
      await queryClient.cancelQueries({ queryKey: ["google-posts-explore"] });

      const previousPosts = queryClient.getQueryData<Post[]>([
        "google-posts-explore",
      ]);

      queryClient.setQueryData<Post[]>(["google-posts-explore"], (old) => {
        if (!old) return [];
        return old.map((post) => {
          if (post.idPostingan === postId) {
            return {
              ...post,
              like: type === "like" ? (post.like || 0) + 1 : (post.like || 0),
              dislike: type === "dislike" ? (post.dislike || 0) + 1 : (post.dislike || 0),
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ["google-posts-explore"],
          context.previousPosts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["google-posts-explore"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["google-posts-explore"] });

      const previousPosts = queryClient.getQueryData<Post[]>([
        "google-posts-explore",
      ]);

      queryClient.setQueryData<Post[]>(["google-posts-explore"], (old) =>
        old ? old.filter((post) => post.idPostingan !== postId) : [],
      );

      return { previousPosts };
    },
    onError: (err, postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          ["google-posts-explore"],
          context.previousPosts,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["google-posts-explore"] });
    },
  });

  const typedPosts = posts as Post[];

  const filteredPosts = typedPosts.filter(
    (post: Post) => {
      const judul = typeof post.judul === 'string' ? post.judul : String(post.judul || '');
      const deskripsi = typeof post.deskripsi === 'string' ? post.deskripsi : String(post.deskripsi || '');
      const username = typeof post.username === 'string' ? post.username : String(post.username || '');
      return judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase());
    }
  );

  // Get trending topics from posts
  const trendingTopics = typedPosts.reduce(
    (topics: { [key: string]: number }, post: Post) => {
      const judul = typeof post.judul === 'string' ? post.judul : String(post.judul || '');
      const deskripsi = typeof post.deskripsi === 'string' ? post.deskripsi : String(post.deskripsi || '');
      const words = judul
        .toLowerCase()
        .split(" ")
        .concat(deskripsi.toLowerCase().split(" "));
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

  const quickStats = [
    {
      number: typedPosts.length,
      label: "Total Posts",
      icon: MessageSquare,
      color: "bg-yellow-400",
    },
    {
      number: typedPosts.reduce(
        (sum: number, p: Post) => sum + (p.likes || 0),
        0,
      ),
      label: "Total Likes",
      icon: Heart,
      color: "bg-pink-400",
    },
    {
      number: typedPosts.filter(
        (p: Post) =>
          new Date(p.timestamp).toDateString() === new Date().toDateString(),
      ).length,
      label: "Hari Ini",
      icon: Zap,
      color: "bg-green-400",
    },
    {
      number: "98%",
      label: "Engagement",
      icon: TrendingUp,
      color: "bg-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div
          className={`mb-8 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="bg-cyan-400 p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Globe className="text-black text-3xl" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-black mb-2">
                  JELAJAHI POSTINGAN
                </h1>
                <p className="text-xl font-bold text-black">
                  Temukan keluh kesah dan aspirasi mahasiswa Indonesia
                </p>
              </div>
            </div>

            <div className="inline-flex items-center space-x-3 bg-white text-black px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-5 h-5" />
              <span className="font-black text-lg uppercase tracking-wide">
                EXPLORE COMMUNITY
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Search Section */}
            <div
              className={`mb-8 transform transition-all duration-1000 delay-300 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-yellow-400 p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Search className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black uppercase">
                        Cari Postingan
                      </h2>
                      <p className="text-lg font-bold text-gray-600">
                        Temukan topik yang kamu cari
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari postingan, user, atau topik..."
                      className="pl-14 py-4 border-4 border-black rounded-xl focus:border-cyan-400 text-lg font-bold"
                    />
                    <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-pink-400 text-black hover:bg-pink-500 border-4 border-black rounded-xl px-6 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Filter className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Posts Feed */}
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
                      {searchQuery ? "HASIL PENCARIAN" : "SEMUA POSTINGAN"}
                    </h2>
                    <p className="text-lg font-bold text-gray-600">
                      {filteredPosts.length} postingan ditemukan
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: ["google-posts-explore"],
                    })
                  }
                  className="border-4 border-black text-black bg-white hover:bg-gray-100 rounded-2xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-16">
                  <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce inline-block">
                    <Search className="text-black text-6xl" />
                  </div>
                  <h3 className="text-3xl font-black text-black mb-4">
                    LOADING POSTS...
                  </h3>
                  <p className="text-lg font-bold text-gray-600">
                    Mencari postingan terbaru
                  </p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 inline-block">
                      <Search className="text-black text-6xl" />
                    </div>
                    <h3 className="text-3xl font-black text-black mb-4 uppercase">
                      {searchQuery ? "Tidak Ada Hasil" : "Belum Ada Postingan"}
                    </h3>
                    <p className="text-lg font-bold text-gray-600 mb-8">
                      {searchQuery
                        ? "Coba kata kunci yang berbeda atau hapus filter pencarian"
                        : "Jadilah yang pertama membuat postingan!"}
                    </p>
                    {searchQuery && (
                      <Button
                        onClick={() => setSearchQuery("")}
                        className="bg-yellow-400 text-black hover:bg-yellow-500 border-4 border-black rounded-2xl px-8 py-4 font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                      >
                        <Target className="w-6 h-6 mr-3" />
                        HAPUS FILTER
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredPosts
                    .sort((a, b) => {
                      const dateA = new Date(a.timestamp).getTime();
                      const dateB = new Date(b.timestamp).getTime();

                      if (
                        isNaN(dateA) ||
                        isNaN(dateB) ||
                        Math.abs(dateA - dateB) < 1000
                      ) {
                        const idA = Number.parseInt(
                          a.idPostingan.replace(/\D/g, "") || "0",
                        );
                        const idB = Number.parseInt(
                          b.idPostingan.replace(/\D/g, "") || "0",
                        );
                        return idB - idA;
                      }

                      return dateB - dateA;
                    })
                    .map((post: Post, index) => (
                      <PostCard
                        key={`${post.idPostingan}-${index}-${post.timestamp}`}
                        post={post}
                        onLike={(postId, type) => {
                          if (user) {
                            likePostMutation.mutate({ postId, type });
                          }
                        }}
                        onDelete={(postId) => {
                          if (user) {
                            deletePostMutation.mutate(postId);
                          }
                        }}
                        onUpdate={() => {
                          queryClient.invalidateQueries({
                            queryKey: ["/api/posts"],
                          });
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div
            className={`space-y-8 transform transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Trending Topics */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-400 p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <TrendingUp className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black uppercase">
                      Trending Topics
                    </h3>
                    <p className="text-sm font-bold text-gray-600">
                      Topik yang sedang hangat
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {topTrending.map(({ topic, count }, index) => (
                    <div
                      key={topic}
                      className="bg-gray-50 hover:bg-yellow-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-black font-black text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-black text-lg capitalize text-black group-hover:text-black">
                              #{topic}
                            </p>
                            <p className="text-gray-600 text-sm font-bold">
                              {count} postingan
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-pink-400 text-black border-2 border-black font-black rounded-full">
                          HOT
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-purple-400 p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <BarChart3 className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-black uppercase">
                      Statistik Hari Ini
                    </h3>
                    <p className="text-sm font-bold text-gray-600">
                      Data real-time platform
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-yellow-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                    <div>
                      <span className="text-black font-bold text-lg uppercase">
                        Postingan Baru
                      </span>
                      <div className="text-3xl font-black text-black">
                        +
                        {
                          typedPosts.filter(
                            (p: Post) =>
                              new Date(p.timestamp).toDateString() ===
                              new Date().toDateString(),
                          ).length
                        }
                      </div>
                    </div>
                    <MessageSquare className="w-8 h-8 text-black" />
                  </div>

                  <div className="bg-pink-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                    <div>
                      <span className="text-black font-bold text-lg uppercase">
                        Total Likes
                      </span>
                      <div className="text-3xl font-black text-black">
                        +
                        {typedPosts.reduce(
                          (sum: number, p: Post) => sum + (p.likes || 0),
                          0,
                        )}
                      </div>
                    </div>
                    <Heart className="w-8 h-8 text-black" />
                  </div>

                  <div className="bg-green-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center">
                    <div>
                      <span className="text-black font-bold text-lg uppercase">
                        Total Posts
                      </span>
                      <div className="text-3xl font-black text-black">
                        {typedPosts.length}
                      </div>
                    </div>
                    <Users className="w-8 h-8 text-black" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
