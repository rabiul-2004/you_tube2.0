import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { MessageSquare } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
      });
      if (res.data?._id) {
        setComments([res.data, ...comments]);
      }
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(`/comment/editcomment/${editingCommentId}`, {
        commentbody: editText,
      });
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId ? { ...c, commentbody: editText } : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="h-6 w-32 bg-gray-200 rounded animate-skeleton" />
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-20 bg-gray-200 rounded animate-skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        {comments.length} Comments
      </h2>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e: any) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4 animate-fade-up">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="text-sm">
                  {comment.usercommented?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {comment.usercommented}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="text-sm min-h-[60px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={handleUpdateComment} disabled={!editText.trim()}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingCommentId(null); setEditText(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-800">{comment.commentbody}</p>
                    {comment.userid === user?._id && (
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                        <button
                          className="hover:text-black transition-colors font-medium"
                          onClick={() => handleEdit(comment)}
                        >
                          Edit
                        </button>
                        <button
                          className="hover:text-red-600 transition-colors font-medium"
                          onClick={() => handleDelete(comment._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
