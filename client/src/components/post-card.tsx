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

  const canDelete = user && (
    user.idUsers === post.idUsers || 
    user.idUsers === post.userId || 
    user.role === 'admin'
  );

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
        
        {post.imageUrl && post.imageUrl.trim() !== "" && (
          <div className="relative w-full max-w-lg mb-3">
            <div className="w-full bg-gray-100 rounded-xl border border-gray-200 p-4 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
                 onClick={() => {
                   // Extract file ID for proper Google Drive viewing
                   if (post.imageUrl) {
                     const fileIdMatch = post.imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                     if (fileIdMatch) {
                       const viewUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/view`;
                       window.open(viewUrl, '_blank');
                     }
                   }
                 }}
            >
              <svg className="w-16 h-16 mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span className="text-lg font-medium text-blue-600 mb-1">📸 Gambar Terlampir</span>
              <span className="text-sm text-gray-600 text-center">Klik untuk melihat gambar di Google Drive</span>
              <span className="text-xs text-gray-400 mt-2 px-3 py-1 bg-gray-200 rounded-full">Google Drive</span>
            </div>
          </div>
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
