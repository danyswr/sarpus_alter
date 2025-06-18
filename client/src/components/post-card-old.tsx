import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, MessageCircle, Trash2, Edit3, Check, X, Send } from "lucide-react";
import type { Post, Comment } from "@/lib/api";
import { api } from "@/lib/api";

interface PostCardProps {
  post: Post;
  onLike: (postId: string, type: 'like' | 'dislike') => void;
  onDelete?: (postId: string) => void;
  onUpdate?: () => void;
}

function PostCard({ post, onLike, onDelete, onUpdate }: PostCardProps) {
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
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(post.dislikes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    // Optimistic UI update
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    setIsLiking(true);
    setIsLiked(!wasLiked);
    if (wasDisliked) {
      setIsDisliked(false);
      setLocalDislikes(prev => Math.max(0, prev - 1));
    }
    if (!wasLiked) {
      setLocalLikes(prev => prev + 1);
    } else {
      setLocalLikes(prev => Math.max(0, prev - 1));
    }

    try {
      await onLike(post.idPostingan, 'like');
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
      setLocalLikes(post.likes || 0);
      setLocalDislikes(post.dislikes || 0);
      console.error('Like failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (!user || isLiking) return;
    
    // Optimistic UI update
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;
    
    setIsLiking(true);
    setIsDisliked(!wasDisliked);
    if (wasLiked) {
      setIsLiked(false);
      setLocalLikes(prev => Math.max(0, prev - 1));
    }
    if (!wasDisliked) {
      setLocalDislikes(prev => prev + 1);
    } else {
      setLocalDislikes(prev => Math.max(0, prev - 1));
    }

    try {
      await onLike(post.idPostingan, 'dislike');
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
      setLocalLikes(post.likes || 0);
      setLocalDislikes(post.dislikes || 0);
      console.error('Dislike failed:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Use the correct API endpoint format that matches our Google Apps Script
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updatePost',
          postId: post.idPostingan,
          idPostingan: post.idPostingan,
          userId: user.idUsers,
          judul: editJudul,
          deskripsi: editDeskripsi
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error:', errorData.error);
        return;
      }
      
      const result = await response.json();
      console.log('Update successful:', result);
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const loadComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const commentsData = await api.posts.getComments(post.idPostingan);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      loadComments();
    }
  };

  const handlePostComment = async () => {
    if (!user || !newComment.trim() || isPostingComment) return;
    
    setIsPostingComment(true);
    try {
      const result = await api.posts.createComment(post.idPostingan, user.idUsers, newComment.trim());
      if (result.comment) {
        const newCommentWithUsername = {
          ...result.comment,
          username: user.username
        };
        setComments(prev => [...prev, newCommentWithUsername]);
        setNewComment("");
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      await api.posts.deleteComment(commentId, user.idUsers);
      setComments(prev => prev.filter(c => c.idComment !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatCommentTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
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
            className={`flex items-center space-x-2 hover:text-blue-500 transition-colors ${
              isLiked ? 'text-blue-500' : ''
            }`}
            disabled={!user || isLiking}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{localLikes}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDislike}
            className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
              isDisliked ? 'text-red-500' : ''
            }`}
            disabled={!user || isLiking}
          >
            <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
            <span>{localDislikes}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleComments}
            className="flex items-center space-x-2 hover:text-green-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length > 0 ? comments.length : 'Komentar'}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {/* Comment Input */}
            {user && (
              <div className="flex space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || isPostingComment}
                    size="sm"
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center text-gray-500 py-4">Memuat komentar...</div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.idComment} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {comment.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.username || 'User'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatCommentTime(comment.timestamp)}
                            </span>
                            {user && (user.idUsers === comment.idUsers || user.role === 'admin') && (
                              <Button
                                onClick={() => handleDeleteComment(comment.idComment)}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-red-500 p-1 h-auto"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                Belum ada komentar. Jadilah yang pertama berkomentar!
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { PostCard };