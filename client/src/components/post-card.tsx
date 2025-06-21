"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Trash2,
  Edit3,
  Check,
  X,
  Send,
  Clock,
} from "lucide-react";
import type { Post, Comment } from "@/lib/api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  onLike: (postId: string, type: "like" | "dislike") => void;
  onDelete?: (postId: string) => void;
  onUpdate?: () => void;
}

function PostCard({ post, onLike, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth();

  // Check localStorage for persistent like status
  const getLikeStatus = () => {
    if (!user) return { liked: false, disliked: false };
    const userLikes = JSON.parse(
      localStorage.getItem(`user_likes_${user.idUsers}`) || "{}",
    );
    return {
      liked: userLikes[post.idPostingan]?.liked || false,
      disliked: userLikes[post.idPostingan]?.disliked || false,
    };
  };

  const likeStatus = getLikeStatus();
  const [isLiked, setIsLiked] = useState(likeStatus.liked);
  const [isDisliked, setIsDisliked] = useState(likeStatus.disliked);
  const [isEditing, setIsEditing] = useState(false);
  const [editJudul, setEditJudul] = useState(post.judul || "");
  const [editDeskripsi, setEditDeskripsi] = useState(post.deskripsi || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.like || post.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(
    post.dislike || post.dislikes || 0,
  );
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const saveLikeStatus = (liked: boolean, disliked: boolean) => {
    if (!user) return;
    const userLikes = JSON.parse(
      localStorage.getItem(`user_likes_${user.idUsers}`) || "{}",
    );
    userLikes[post.idPostingan] = { liked, disliked };
    localStorage.setItem(
      `user_likes_${user.idUsers}`,
      JSON.stringify(userLikes),
    );
  };

  const handleLike = async () => {
    if (!user || isLiking) return;

    // Optimistic UI update
    const wasLiked = isLiked;
    const wasDisliked = isDisliked;

    setIsLiking(true);
    setIsLiked(!wasLiked);
    if (wasDisliked) {
      setIsDisliked(false);
      setLocalDislikes((prev) => Math.max(0, prev - 1));
    }
    if (!wasLiked) {
      setLocalLikes((prev) => prev + 1);
    } else {
      setLocalLikes((prev) => Math.max(0, prev - 1));
    }

    // Save to localStorage for persistence
    saveLikeStatus(!wasLiked, false);

    try {
      await onLike(post.idPostingan, "like");
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
      setLocalLikes(post.likes || 0);
      setLocalDislikes(post.dislikes || 0);
      saveLikeStatus(wasLiked, wasDisliked);
      console.error("Like failed:", error);
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
      setLocalLikes((prev) => Math.max(0, prev - 1));
    }
    if (!wasDisliked) {
      setLocalDislikes((prev) => prev + 1);
    } else {
      setLocalDislikes((prev) => Math.max(0, prev - 1));
    }

    // Save to localStorage for persistence
    saveLikeStatus(false, !wasDisliked);

    try {
      await onLike(post.idPostingan, "dislike");
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      setIsDisliked(wasDisliked);
      setLocalLikes(post.likes || 0);
      setLocalDislikes(post.dislikes || 0);
      saveLikeStatus(wasLiked, wasDisliked);
      console.error("Dislike failed:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      console.log("Updating post:", {
        postId: post.idPostingan,
        userId: user.idUsers,
        judul: editJudul,
        deskripsi: editDeskripsi,
      });

      let token = null;
      try {
        const savedUser = localStorage.getItem("feedbacku_user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          token = userData.token;
        }
      } catch (error) {
        console.error("Error parsing user data for token:", error);
      }

      if (!token) {
        console.error("No authentication token found");
        alert("Please log in again to update posts");
        return;
      }
      const response = await fetch(`/api/posts/${post.idPostingan}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          judul: editJudul,
          deskripsi: editDeskripsi,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update error:", errorData);
        alert("Error updating post: " + (errorData.error || "Unknown error"));
        return;
      }

      const result = await response.json();
      console.log("Update successful:", result);

      if (result.error) {
        alert("Error: " + result.error);
        return;
      }

      setIsEditing(false);
      // Force refresh of posts list to show updated content
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Update error:", error);
      alert(
        "Network error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
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
      console.error("Error loading comments:", error);
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

    const commentText = newComment.trim();
    const tempId = "temp_" + Date.now();

    // Optimistic UI update - add comment immediately
    const optimisticComment: Comment = {
      id: tempId,
      idComment: tempId,
      idPostingan: post.idPostingan,
      userId: user.idUsers,
      idUsers: user.idUsers,
      commentText: commentText,
      comment: commentText,
      timestamp: new Date().toISOString(),
      username: user.username,
    };

    setComments((prev) => [...prev, optimisticComment]);
    setNewComment("");
    setIsPostingComment(true);

    try {
      const result = await api.posts.createComment(
        post.idPostingan,
        commentText,
      );
      console.log("Comment creation result:", result);

      if (
        result.comment ||
        (result.message && result.message.includes("berhasil"))
      ) {
        // Replace optimistic comment with real one
        let realComment: Comment;
        if (result.comment) {
          realComment = {
            ...result.comment,
            userId:
              result.comment.idUsers || result.comment.userId || user.idUsers,
            commentText:
              result.comment.comment ||
              result.comment.commentText ||
              commentText,
            username: user.username,
          };
        } else {
          realComment = {
            id: "COMMENT_" + Date.now(),
            idComment: "COMMENT_" + Date.now(),
            idPostingan: post.idPostingan,
            userId: user.idUsers,
            idUsers: user.idUsers,
            commentText: commentText,
            comment: commentText,
            timestamp: new Date().toISOString() as any,
            username: user.username,
          };
        }

        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? realComment : c)),
        );
      } else {
        // Remove optimistic comment on failure
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        alert("Gagal membuat komentar");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      alert(
        "Error posting comment: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    // Optimistic UI update - remove comment immediately
    const commentToDelete = comments.find(
      (c) => (c.idComment || c.id) === commentId,
    );
    setComments((prev) =>
      prev.filter((c) => (c.idComment || c.id) !== commentId),
    );

    try {
      const result = await api.posts.deleteComment(commentId);
      console.log("Delete comment result:", result);

      if (!result.message || !result.message.includes("berhasil")) {
        // Restore comment if deletion failed
        if (commentToDelete) {
          setComments((prev) => [...prev, commentToDelete]);
        }
        alert("Gagal menghapus komentar");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(
        "Error deleting comment: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const formatCommentTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  const canEdit =
    user && (user.idUsers === post.idUsers || user.idUsers === post.userId);

  const canDelete =
    user &&
    (user.idUsers === post.idUsers ||
      user.idUsers === post.userId ||
      user.role === "admin");

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes}m yang lalu`;
    if (diffInHours < 24) return `${diffInHours}h yang lalu`;
    if (diffInDays < 7) return `${diffInDays}h yang lalu`;
    if (diffInWeeks < 4) return `${diffInWeeks}w yang lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-[1.01] rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-cyan-400 to-blue-400 border-b-2 border-black p-4">
        <div className="flex justify-between items-start">
          <div className="flex space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-white text-lg font-black">
                {post.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-black text-black text-base">
                  {post.username || "Unknown User"}
                </h4>
                <Badge className="bg-white text-black border border-black font-black rounded-full text-xs px-2 py-0.5 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(post.timestamp)}</span>
                </Badge>
              </div>
              {isEditing ? (
                <Input
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  placeholder="Judul postingan..."
                  className="font-black text-lg mb-2 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white"
                />
              ) : (
                <h3 className="font-black text-lg text-black">{post.judul}</h3>
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
                  className="bg-green-400 text-black hover:bg-green-500 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 font-black"
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
                  className="bg-gray-400 text-black hover:bg-gray-500 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 font-black"
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
                    className="bg-blue-400 text-black hover:bg-blue-500 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 font-black"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
                {canDelete && onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-red-400 text-black hover:bg-red-500 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 font-black"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-xl text-black">
                          Konfirmasi Hapus Post
                        </AlertDialogTitle>
                        <AlertDialogDescription className="font-bold text-gray-700">
                          Apakah Anda yakin ingin menghapus postingan "
                          {post.judul}"? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-400 text-black border-2 border-black rounded-xl font-black hover:bg-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(post.idPostingan)}
                          className="bg-red-400 text-black border-2 border-black rounded-xl font-black hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          Ya, Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {isEditing ? (
          <Textarea
            value={editDeskripsi}
            onChange={(e) => setEditDeskripsi(e.target.value)}
            placeholder="Tulis keluh kesah Anda..."
            className="mb-3 resize-none border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-medium"
            rows={3}
          />
        ) : (
          <p className="text-black mb-3 font-medium text-base leading-relaxed">
            {post.deskripsi}
          </p>
        )}

        {post.imageUrl && post.imageUrl.trim() !== "" && (
          <div className="relative w-full max-w-lg mb-4">
            <img
              src={post.imageUrl || "/placeholder.svg"}
              alt="Gambar postingan"
              className="w-full h-auto rounded-xl border-2 border-black object-cover max-h-96 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
              onLoad={(e) => {
                console.log("Image loaded successfully:", post.imageUrl);
              }}
            />
            <div
              className="hidden w-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl border-2 border-black p-4 flex-col items-center justify-center text-black cursor-pointer hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => {
                if (post.imageUrl) {
                  const fileIdMatch = post.imageUrl.match(
                    /\/d\/([a-zA-Z0-9_-]+)/,
                  );
                  if (fileIdMatch) {
                    const viewUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/view`;
                    window.open(viewUrl, "_blank");
                  } else {
                    window.open(post.imageUrl, "_blank");
                  }
                }
              }}
            >
              <svg
                className="w-16 h-16 mb-3 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <span className="text-lg font-black text-black mb-1">
                📸 Gambar Terlampir
              </span>
              <span className="text-sm font-bold text-black text-center">
                Klik untuk melihat gambar di Google Drive
              </span>
              <Badge className="text-xs font-black mt-2 px-3 py-1 bg-white text-black border-2 border-black rounded-full">
                Google Drive
              </Badge>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 border-t-2 border-black pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "flex items-center space-x-2 transition-all duration-300 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-105",
              isLiked
                ? "bg-green-400 text-black hover:bg-green-500"
                : "bg-white text-black hover:bg-green-100",
            )}
            disabled={!user || isLiking}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span>{localLikes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDislike}
            className={cn(
              "flex items-center space-x-2 transition-all duration-300 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-105",
              isDisliked
                ? "bg-red-400 text-black hover:bg-red-500"
                : "bg-white text-black hover:bg-red-100",
            )}
            disabled={!user || isLiking}
          >
            <ThumbsDown
              className={`w-4 h-4 ${isDisliked ? "fill-current" : ""}`}
            />
            <span>{localDislikes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleComments}
            className={cn(
              "flex items-center space-x-2 transition-all duration-300 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:scale-105",
              showComments
                ? "bg-blue-400 text-black hover:bg-blue-500"
                : "bg-white text-black hover:bg-blue-100",
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length > 0 ? comments.length : "Komentar"}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t-2 border-black">
            {/* Comment Input */}
            {user && (
              <div className="flex space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-white text-sm font-black">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="flex-1 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-medium"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || isPostingComment}
                    size="sm"
                    className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center text-black py-4 bg-gray-100 rounded-xl border-2 border-black font-bold">
                Memuat komentar...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.idComment || comment.id}
                    className="flex space-x-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-white text-xs font-black">
                        {comment.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-xl px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-sm text-black">
                            {comment.username || "User"}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-white text-black border border-black font-black rounded-full text-xs px-2 py-0.5">
                              {formatCommentTime(
                                comment.timestamp?.toString() || "",
                              )}
                            </Badge>
                            {user &&
                              (user.idUsers === comment.userId ||
                                user.idUsers === comment.idUsers ||
                                user.role === "admin") && (
                                <Button
                                  onClick={() =>
                                    handleDeleteComment(
                                      comment.idComment || comment.id || "",
                                    )
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="bg-red-400 text-black hover:bg-red-500 border border-black rounded-full p-1 h-auto w-auto font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                          </div>
                        </div>
                        <p className="text-black text-sm font-medium">
                          {comment.commentText || comment.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-black py-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl border-2 border-black font-bold">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p>Belum ada komentar. Jadilah yang pertama berkomentar!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { PostCard };
