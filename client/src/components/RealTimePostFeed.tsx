import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/lib/websocket";
import { postsApi, type Post } from "@/lib/api";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

export function RealTimePostFeed() {
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(0);
  const queryClient = useQueryClient();

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: () => postsApi.getAllPosts(),
    refetchInterval: isRealTimeConnected ? false : 5000, // Only poll if WebSocket disconnected
    staleTime: 1000, // Consider data stale after 1 second for real-time feel
  });

  useEffect(() => {
    // Track WebSocket connection status
    const checkConnection = () => {
      setIsRealTimeConnected(wsClient.isConnected());
    };

    // Check every second
    const connectionCheck = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    // Handle real-time post updates
    const handleNewPost = (data: any) => {
      console.log('Real-time new post:', data.post);
      setLiveUpdates(prev => prev + 1);
      
      // Update the cache immediately
      queryClient.setQueryData(["/api/posts"], (oldPosts: Post[] | undefined) => {
        if (!oldPosts) return [data.post];
        
        // Check if post already exists
        const exists = oldPosts.some(p => p.idPostingan === data.post.idPostingan);
        if (exists) return oldPosts;
        
        return [data.post, ...oldPosts];
      });
    };

    const handlePostUpdated = (data: any) => {
      console.log('Real-time post updated:', data.post);
      setLiveUpdates(prev => prev + 1);
      
      // Update the specific post in cache
      queryClient.setQueryData(["/api/posts"], (oldPosts: Post[] | undefined) => {
        if (!oldPosts) return oldPosts;
        
        return oldPosts.map(post => 
          post.idPostingan === data.post.idPostingan 
            ? { ...post, ...data.post }
            : post
        );
      });
    };

    const handlePostDeleted = (data: any) => {
      console.log('Real-time post deleted:', data.postId);
      setLiveUpdates(prev => prev + 1);
      
      // Remove the post from cache
      queryClient.setQueryData(["/api/posts"], (oldPosts: Post[] | undefined) => {
        if (!oldPosts) return oldPosts;
        
        return oldPosts.filter(post => post.idPostingan !== data.postId);
      });
    };

    const handlePostInteraction = (data: any) => {
      console.log('Real-time post interaction:', data);
      setLiveUpdates(prev => prev + 1);
      
      // Update post with new interaction data
      if (data.post) {
        queryClient.setQueryData(["/api/posts"], (oldPosts: Post[] | undefined) => {
          if (!oldPosts) return oldPosts;
          
          return oldPosts.map(post => 
            post.idPostingan === data.postId 
              ? { ...post, ...data.post }
              : post
          );
        });
      }
    };

    // Register WebSocket event handlers
    wsClient.on('new_post', handleNewPost);
    wsClient.on('post_updated', handlePostUpdated);
    wsClient.on('post_deleted', handlePostDeleted);
    wsClient.on('post_interaction', handlePostInteraction);

    return () => {
      clearInterval(connectionCheck);
      wsClient.off('new_post', handleNewPost);
      wsClient.off('post_updated', handlePostUpdated);
      wsClient.off('post_deleted', handlePostDeleted);
      wsClient.off('post_interaction', handlePostInteraction);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-[200px] w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">Gagal memuat posts</p>
        <button 
          onClick={() => refetch()}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${
            isRealTimeConnected ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {isRealTimeConnected ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isRealTimeConnected ? 'Real-time Updates Active' : 'Using Polling Updates'}
            </span>
          </div>
          
          {liveUpdates > 0 && (
            <Badge variant="secondary" className="animate-pulse">
              {liveUpdates} live updates
            </Badge>
          )}
        </div>
        
        <button
          onClick={() => refetch()}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Refresh posts"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Posts Feed */}
      {!posts || posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-gray-500 mb-4">Belum ada posts yang dibuat</p>
          <p className="text-sm text-gray-400">
            Jadilah yang pertama membuat post untuk memulai diskusi!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.idPostingan} className="transform transition-all duration-200 hover:scale-[1.01]">
            <PostCard 
              post={post} 
              onLike={async (postId: string, type: 'like' | 'dislike') => {
                // Real-time like/dislike will be handled via WebSocket
                try {
                  await postsApi.likePost(postId, type);
                } catch (error) {
                  console.error('Failed to like/dislike post:', error);
                }
              }}
              onDelete={async (postId: string) => {
                try {
                  await postsApi.deletePost(postId);
                  // Real-time update will be handled via WebSocket
                } catch (error) {
                  console.error('Failed to delete post:', error);
                }
              }}
              onUpdate={() => {
                // Trigger refetch for updated posts
                queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
              }}
            />
          </div>
        ))
      )}
    </div>
  );
}