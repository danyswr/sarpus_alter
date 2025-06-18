import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, Trash2, MoreHorizontal } from "lucide-react";
import type { Post } from "@/lib/api";

interface PostCardProps {
  post: Post;
  onLike: (postId: string, type: 'like' | 'dislike') => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onLike, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(
    user ? post.likedBy?.includes(user.idUsers) : false
  );
  const [isDisliked, setIsDisliked] = useState(
    user ? post.dislikedBy?.includes(user.idUsers) : false
  );

  const handleLike = () => {
    if (!user) return;
    onLike(post.idPostingan, 'like');
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    if (!user) return;
    onLike(post.idPostingan, 'dislike');
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  const canDelete = user && (user.idUsers === post.idUsers || user.role === 'admin');

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours}j`;
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}h`;
    return date.toLocaleDateString('id-ID');
  };

  return (
    <Card className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {post.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-gray-900">{post.username || 'Unknown User'}</h4>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500 text-sm">{formatTimestamp(post.timestamp)}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{post.judul}</h3>
            </div>
          </div>
          
          {canDelete && onDelete && (
            <Button
              onClick={() => onDelete(post.idPostingan)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-700 mb-3">{post.deskripsi}</p>
        
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt="Post attachment" 
            className="rounded-xl w-full max-w-lg mb-3"
            onError={(e) => {
              console.error("Image failed to load:", post.imageUrl);
              // Show placeholder for failed images
              e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkdhbWJhciBkYXJpIEdvb2dsZSBEcml2ZTwvdGV4dD4KPHN2ZyB4PSIxMzAiIHk9IjcwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzlDQTNBRiI+CjxwYXRoIGQ9Im0yLjI1IDE1Ljc1IDUuMTU5LTUuMTU5YTIuMjUgMi4yNSAwIDAgMSAzLjE4MiAwbDUuMTU5IDUuMTU5bS0xLjUtMS41IDEuNDA5LTEuNDA5YTIuMjUgMi4yNSAwIDAgMSAzLjE4MiAwbDIuOTA5IDIuOTA5bS0xOCAzLjc1aDE2LjVhMS41IDEuNSAwIDAgMCAxLjUtMS41VjZhMS41IDEuNSAwIDAgMC0xLjUtMS41SDMuNzVBMS41IDEuNSAwIDAgMCAyLjI1IDZ2MTJhMS41IDEuNSAwIDAgMCAxLjUgMS41Wm0xMC41LTExLjI1aC4wMDh2LjAwOGgtLjAwOFY4LjI1Wm0uMzc1IDBhLjM3NS4zNzUgMCAxIDEtLjc1IDAgLjM3NS4zNzUgMCAwIDEgLjc1IDBaIi8+Cjwvc3ZnPgo8L3N2Zz4K";
            }}
            onLoad={() => {
              console.log("Post image loaded successfully:", post.imageUrl);
            }}
          />
        )}

        <div className="flex items-center space-x-6 text-gray-500">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
              isLiked ? 'text-red-500' : ''
            }`}
            disabled={!user}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDislike}
            className={`flex items-center space-x-2 hover:text-blue-500 transition-colors ${
              isDisliked ? 'text-blue-500' : ''
            }`}
            disabled={!user}
          >
            <MessageCircle className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
            <span>{post.dislikes || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 hover:text-green-500 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
