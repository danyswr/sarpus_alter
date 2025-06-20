import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, postsApi, type Post } from "@/lib/api";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Heart, 
  TrendingUp,
  Activity,
  AlertCircle,
  Crown
} from "lucide-react";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || !user.role || user.role.toLowerCase() !== 'admin')) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    enabled: !!user && !!user.role && user.role.toLowerCase() === 'admin',
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onSuccess: (data, postId) => {
      console.log('Delete success:', data);
      // Force immediate cache update by removing the post from local state
      queryClient.setQueryData(["/api/posts"], (oldPosts: Post[] | undefined) => {
        if (!oldPosts) return [];
        return oldPosts.filter(post => post.idPostingan !== postId);
      });
      // Also invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
    }
  });

  if (authLoading || !user || !user.role || user.role.toLowerCase() !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Calculate statistics
  const postsArray = Array.isArray(posts) ? posts as Post[] : [];
  const stats = {
    totalPosts: postsArray.length,
    totalLikes: postsArray.reduce((sum: number, post: Post) => sum + (post.likes || 0), 0),
    totalDislikes: postsArray.reduce((sum: number, post: Post) => sum + (post.dislikes || 0), 0),
    avgLikesPerPost: postsArray.length > 0 ? Math.round(postsArray.reduce((sum: number, post: Post) => sum + (post.likes || 0), 0) / postsArray.length) : 0,
    todayPosts: postsArray.filter((post: Post) => 
      new Date(post.timestamp).toDateString() === new Date().toDateString()
    ).length,
  };

  // Get most popular posts
  const popularPosts = [...postsArray]
    .sort((a: Post, b: Post) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 5);

  // Get recent activity
  const recentPosts = [...postsArray]
    .sort((a: Post, b: Post) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

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
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Admin Dashboard</h1>
          </div>
          <div></div>
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <Crown className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
              </div>
              <p className="text-gray-600">Overview aktivitas dan statistik platform</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Postingan</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <FileText className="text-primary text-xl" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <TrendingUp className="text-green-500 text-xs mr-1" />
                    <span className="text-green-500">+{stats.todayPosts}</span>
                    <span className="text-gray-500 ml-1">hari ini</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Likes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
                    </div>
                    <div className="bg-secondary/10 p-3 rounded-lg">
                      <Heart className="text-secondary text-xl" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <Activity className="text-blue-500 text-xs mr-1" />
                    <span className="text-blue-500">{stats.avgLikesPerPost}</span>
                    <span className="text-gray-500 ml-1">rata-rata per post</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Dislikes</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDislikes}</p>
                    </div>
                    <div className="bg-accent/10 p-3 rounded-lg">
                      <AlertCircle className="text-accent text-xl" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-500">Feedback negatif</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Engagement Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {postsArray.length > 0 ? Math.round(((stats.totalLikes + stats.totalDislikes) / postsArray.length) * 100) / 100 : 0}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <BarChart3 className="text-green-600 text-xl" />
                    </div>
                  </div>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="text-gray-500">interaksi per post</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Popular Posts */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                    Postingan Terpopuler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {popularPosts.map((post: Post, index: number) => (
                      <div key={post.idPostingan} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{post.judul}</p>
                          <p className="text-gray-500 text-xs">{post.likes} likes • {post.username}</p>
                        </div>
                        <Button
                          onClick={() => deletePostMutation.mutate(post.idPostingan)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-secondary" />
                    Aktivitas Terbaru
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPosts.map((post: Post) => (
                      <div key={post.idPostingan} className="flex items-center space-x-3 p-3 border-l-4 border-primary bg-primary/5">
                        <FileText className="text-primary w-5 h-5" />
                        <div className="text-sm flex-1">
                          <p>
                            <span className="font-semibold">{post.username}</span> membuat postingan baru
                          </p>
                          <p className="text-gray-600 text-xs truncate">"{post.judul}"</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(post.timestamp).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <Button
                          onClick={() => deletePostMutation.mutate(post.idPostingan)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* All Posts Management */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Kelola Semua Postingan</CardTitle>
                <p className="text-sm text-gray-600">Moderasi dan kelola seluruh postingan di platform</p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading posts...</div>
                ) : postsArray.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada postingan</p>
                  </div>
                ) : (
                  <div className="space-y-0">
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
