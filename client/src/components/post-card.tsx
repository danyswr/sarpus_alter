import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Trash2, Edit3, Check, X } from "lucide-react";
import type { Post } from "@/lib/api";
import { updatePost } from "@/lib/api";

interface PostCardProps {
  post: Post;
  onLike: (postId: string, type: 'like' | 'dislike') => void;
  onDelete?: (postId: string) => void;
  onUpdate?: () => void;
}

export function PostCard({ post, onLike, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(
    user ? post.likedBy?.includes(user.idUsers) : false
  );
  const [isDisliked, setIsDisliked] = useState(
    user ? post.dislikedBy?.includes(user.idUsers) : false
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editJudul, setEditJudul] = useState(post.judul || "");
  const [editDeskripsi, setEditDeskripsi] = useState(post.deskripsi || "");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleUpdatePost = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const result = await updatePost(post.idPostingan, {
        judul: editJudul,
        deskripsi: editDeskripsi,
        userId: user.idUsers
      });
      
      if (result.error) {
        console.error('Update error:', result.error);
        return;
      }
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const canEdit = user && (
    user.idUsers === post.idUsers || 
    user.idUsers === post.userId
  );

  const canDelete = user && (
    user.idUsers === post.idUsers || 
    user.idUsers === post.userId || 
    user.role === 'admin'
  );

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    if (diffInWeeks < 4) return `${diffInWeeks} minggu yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-gray-900">{post.username || 'Unknown User'}</h4>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500 text-sm">{formatTimestamp(post.timestamp)}</span>
              </div>
              {isEditing ? (
                <Input
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  placeholder="Judul postingan..."
                  className="font-bold text-lg mb-2"
                />
              ) : (
                <h3 className="font-bold text-lg text-gray-900">{post.judul}</h3>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {isEditing ? (
              <>
                <Button
                  onClick={handleUpdatePost}
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700"
                  disabled={isUpdating}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditJudul(post.judul || "");
                    setEditDeskripsi(post.deskripsi || "");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
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
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isEditing ? (
          <Textarea
            value={editDeskripsi}
            onChange={(e) => setEditDeskripsi(e.target.value)}
            placeholder="Tulis keluh kesah Anda..."
            className="mb-3 resize-none"
            rows={3}
          />
        ) : (
          <p className="text-gray-700 mb-3">{post.deskripsi}</p>
        )}
        
        {post.imageUrl && post.imageUrl.trim() !== "" && (
          <div className="relative w-full max-w-lg mb-3">
            <img
              src={post.imageUrl}
              alt="Gambar postingan"
              className="w-full h-auto rounded-xl border border-gray-200 object-cover max-h-96"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
              onLoad={(e) => {
                console.log('Image loaded successfully:', post.imageUrl);
              }}
            />
            <div className="hidden w-full bg-gray-100 rounded-xl border border-gray-200 p-4 flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
                 onClick={() => {
                   // Extract file ID for proper Google Drive viewing
                   if (post.imageUrl) {
                     const fileIdMatch = post.imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                     if (fileIdMatch) {
                       const viewUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/view`;
                       window.open(viewUrl, '_blank');
                     } else {
                       window.open(post.imageUrl, '_blank');
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
