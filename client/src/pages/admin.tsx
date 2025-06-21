"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import {
  BarChart3,
  FileText,
  Heart,
  TrendingUp,
  Activity,
  AlertCircle,
  Crown,
  Target,
  MessageSquare,
  Shield,
  RefreshCw,
  Trash2,
  Menu,
} from "lucide-react";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (
      !authLoading &&
      (!user || !user.role || (typeof user.role === 'string' ? user.role.toLowerCase() : user.role) !== "admin")
    ) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: !!user && !!user.role && (typeof user.role === 'string' ? user.role.toLowerCase() : user.role) === "admin",
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onSuccess: (data, postId) => {
      console.log("Delete success:", data);
      queryClient.setQueryData(
        ["/api/posts"],
        (oldPosts: Post[] | undefined) => {
          if (!oldPosts) return [];
          return oldPosts.filter((post) => post.idPostingan !== postId);
        },
      );
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  if (
    authLoading ||
    !user ||
    !user.role ||
    (typeof user.role === 'string' ? user.role.toLowerCase() : user.role) !== "admin"
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce">
            <Crown className="text-black text-8xl mx-auto" />
          </div>
          <h1 className="text-6xl font-black text-black mb-4">ADMIN</h1>
          <p className="text-gray-600 mb-6 font-bold text-xl">
            Loading Dashboard...
          </p>
          <div className="w-80 h-4 bg-gray-200 rounded-full mx-auto border-4 border-black">
            <div
              className="h-full bg-red-400 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const postsArray = Array.isArray(posts) ? (posts as Post[]) : [];
  const stats = {
    totalPosts: postsArray.length,
    totalLikes: postsArray.reduce(
      (sum: number, post: Post) => sum + (post.like || post.likes || 0),
      0,
    ),
    totalDislikes: postsArray.reduce(
      (sum: number, post: Post) => sum + (post.dislike || post.dislikes || 0),
      0,
    ),
    avgLikesPerPost:
      postsArray.length > 0
        ? Math.round(
            postsArray.reduce(
              (sum: number, post: Post) => sum + (post.like || post.likes || 0),
              0,
            ) / postsArray.length,
          )
        : 0,
    todayPosts: postsArray.filter(
      (post: Post) =>
        new Date(post.timestamp).toDateString() === new Date().toDateString(),
    ).length,
  };

  // Get most popular posts
  const popularPosts = [...postsArray]
    .sort((a: Post, b: Post) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 5);

  // Get recent activity
  const recentPosts = [...postsArray]
    .sort(
      (a: Post, b: Post) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 3);

  const quickStats = [
    {
      number: stats.totalPosts,
      label: "Total Posts",
      icon: FileText,
      color: "bg-yellow-400",
      trend: stats.todayPosts,
    },
    {
      number: stats.totalLikes,
      label: "Total Likes",
      icon: Heart,
      color: "bg-pink-400",
      trend: stats.avgLikesPerPost,
    },
    {
      number: stats.totalDislikes,
      label: "Total Dislikes",
      icon: AlertCircle,
      color: "bg-red-400",
      trend: "Feedback",
    },
    {
      number:
        postsArray.length > 0
          ? Math.round(
              ((stats.totalLikes + stats.totalDislikes) / postsArray.length) *
                100,
            ) / 100
          : 0,
      label: "Engagement",
      icon: BarChart3,
      color: "bg-green-400",
      trend: "Per Post",
    },
  ];

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
        <div className="lg:hidden bg-red-400 border-b-4 border-black px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
            className="bg-white border-4 border-black rounded-2xl p-3 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Menu className="w-5 h-5 text-black" />
          </Button>

          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-xl border-2 border-black">
              <Crown className="text-black text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-black text-black">ADMIN</h1>
              <p className="text-xs text-black font-bold -mt-1">DASHBOARD</p>
            </div>
          </div>

          <div className="w-12"></div>
        </div>

        <div className="max-w-7xl mx-auto py-8 px-6">
          {/* Welcome Section */}
          <div
            className={`mb-8 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="bg-red-400 p-8 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Crown className="text-black text-3xl" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-black mb-2">
                    ADMIN DASHBOARD
                  </h1>
                  <p className="text-xl font-bold text-black">
                    Kelola dan moderasi platform SARPUS
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center space-x-3 bg-white text-black px-6 py-3 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="w-5 h-5" />
                <span className="font-black text-lg uppercase tracking-wide">
                  ADMIN CONTROL PANEL
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => (
                <div
                  key={index}
                  className={`${stat.color} p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-black group-hover:scale-110 transition-transform duration-300" />
                    <Badge className="bg-white text-black border-2 border-black font-black text-xs rounded-full">
                      ADMIN
                    </Badge>
                  </div>
                  <div className="text-3xl font-black text-black mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-black font-bold uppercase mb-2">
                    {stat.label}
                  </div>
                  <div className="text-xs text-black font-bold bg-white px-2 py-1 rounded-xl border-2 border-black">
                    {typeof stat.trend === "number"
                      ? `+${stat.trend}`
                      : stat.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts and Data */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {/* Popular Posts */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardHeader className="bg-yellow-400 border-b-4 border-black rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                  <TrendingUp className="w-6 h-6" />
                  <span>Postingan Terpopuler</span>
                  <Badge className="bg-white text-black border-2 border-black font-black rounded-full">
                    TOP 5
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {popularPosts.map((post: Post, index: number) => (
                    <div
                      key={post.idPostingan}
                      className="bg-gray-50 hover:bg-yellow-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-black font-black text-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-lg truncate text-black group-hover:text-black">
                            {post.judul}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-600 font-bold">
                              {post.likes} likes
                            </span>
                            <span className="text-gray-600 font-bold">
                              @{post.username}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            deletePostMutation.mutate(post.idPostingan)
                          }
                          className="bg-red-400 text-black hover:bg-red-500 border-4 border-black rounded-xl p-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardHeader className="bg-green-400 border-b-4 border-black rounded-t-2xl">
                <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                  <Activity className="w-6 h-6" />
                  <span>Aktivitas Terbaru</span>
                  <Badge className="bg-white text-black border-2 border-black font-black rounded-full">
                    LIVE
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {recentPosts.map((post: Post) => (
                    <div
                      key={post.idPostingan}
                      className="bg-gray-50 hover:bg-green-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-white p-3 rounded-xl border-2 border-black">
                          <FileText className="text-black w-5 h-5" />
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-black text-lg text-black group-hover:text-black">
                            <span className="font-black">{post.username}</span>{" "}
                            membuat postingan baru
                          </p>
                          <p className="text-gray-600 font-bold truncate">
                            "{post.judul}"
                          </p>
                          <p className="text-gray-500 font-bold text-xs">
                            {new Date(post.timestamp).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <Button
                          onClick={() =>
                            deletePostMutation.mutate(post.idPostingan)
                          }
                          className="bg-red-400 text-black hover:bg-red-500 border-4 border-black rounded-xl p-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Posts Management */}
          <div
            className={`transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardHeader className="bg-cyan-400 border-b-4 border-black rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-black text-black uppercase">
                    <Target className="w-6 h-6" />
                    <span>Kelola Semua Postingan</span>
                    <Badge className="bg-white text-black border-2 border-black font-black rounded-full">
                      {postsArray.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    onClick={() =>
                      queryClient.invalidateQueries({
                        queryKey: ["/api/posts"],
                      })
                    }
                    className="bg-white text-black hover:bg-gray-100 border-4 border-black rounded-2xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh
                  </Button>
                </div>
                <p className="text-lg font-bold text-black mt-2">
                  Moderasi dan kelola seluruh postingan di platform
                </p>
              </CardHeader>
              <CardContent className="p-8">
                {isLoading ? (
                  <div className="text-center py-16">
                    <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce inline-block">
                      <Crown className="text-black text-6xl" />
                    </div>
                    <h3 className="text-3xl font-black text-black mb-4">
                      LOADING POSTS...
                    </h3>
                    <p className="text-lg font-bold text-gray-600">
                      Mengambil data postingan
                    </p>
                  </div>
                ) : postsArray.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-yellow-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 inline-block">
                      <MessageSquare className="text-black text-6xl" />
                    </div>
                    <h3 className="text-3xl font-black text-black mb-4 uppercase">
                      Belum Ada Postingan
                    </h3>
                    <p className="text-lg font-bold text-gray-600">
                      Platform masih kosong, tunggu user membuat postingan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {postsArray.map((post: Post) => (
                      <PostCard
                        key={post.idPostingan}
                        post={post}
                        onLike={() => {}} // Admin doesn't like posts
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
