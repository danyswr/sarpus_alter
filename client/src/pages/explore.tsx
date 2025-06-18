import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { PostCard } from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Post } from "@/lib/api";
import { Search, TrendingUp } from "lucide-react";

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  const likePostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: 'like' | 'dislike' }) =>
      api.likePost(postId, user!.idUsers, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const filteredPosts = posts.filter((post: Post) =>
    post.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get trending topics from posts
  const trendingTopics = posts
    .reduce((topics: { [key: string]: number }, post: Post) => {
      const words = post.judul.toLowerCase().split(' ').concat(post.deskripsi.toLowerCase().split(' '));
      words.forEach(word => {
        if (word.length > 4 && !['yang', 'dengan', 'untuk', 'adalah', 'akan', 'dari', 'pada', 'dalam'].includes(word)) {
          topics[word] = (topics[word] || 0) + 1;
        }
      });
      return topics;
    }, {});

  const topTrending = Object.entries(trendingTopics)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">Jelajahi Postingan</h1>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari postingan, user, atau topik..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Posts */}
            {isLoading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    {searchQuery ? "Tidak ada postingan yang cocok dengan pencarian" : "Belum ada postingan"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-0">
                {filteredPosts.map((post: Post) => (
                  <PostCard
                    key={post.idPostingan}
                    post={post}
                    onLike={(postId, type) => {
                      if (user) {
                        likePostMutation.mutate({ postId, type });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                  Trending Topics
                </h3>
                <div className="space-y-3">
                  {topTrending.map(({ topic, count }) => (
                    <div key={topic} className="hover:bg-gray-50 p-2 rounded-lg cursor-pointer">
                      <p className="font-semibold text-sm capitalize">#{topic}</p>
                      <p className="text-gray-500 text-xs">{count} postingan</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Statistik Hari Ini</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Postingan Baru</span>
                    <span className="font-bold text-primary">+{posts.filter((p: Post) => 
                      new Date(p.timestamp).toDateString() === new Date().toDateString()
                    ).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Likes</span>
                    <span className="font-bold text-secondary">+{posts.reduce((sum: number, p: Post) => sum + (p.likes || 0), 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-bold text-accent">{posts.length}</span>
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
