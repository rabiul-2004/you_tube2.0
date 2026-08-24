import React, { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { safeDate } from "@/lib/videoUtils";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  Flag,
  Languages,
  Loader2,
  MapPin,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";

interface CommentType {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  likes?: string[];
  dislikes?: string[];
  isFlagged?: boolean;
  language?: string;
  location?: { city: string; state: string };
  showLocation?: boolean;
}

interface FlaggedComment extends CommentType {
  reports?: {
    user?: { _id?: string; name?: string; image?: string };
    reason?: string;
    reportedon?: string;
  }[];
}

interface TranslationState {
  text: string;
  source: string;
  target: string;
  visible: boolean;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "ta", label: "Tamil" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ar", label: "Arabic" },
  { value: "ja", label: "Japanese" },
];

const getPreferredLang = () => {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("yourtube-comment-lang") || "en";
};

const getMyReports = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(
      JSON.parse(window.localStorage.getItem("yourtube-reported-comments") || "[]")
    );
  } catch {
    return new Set();
  }
};

const Comments = ({ videoId, isOwner }: { videoId: string; isOwner?: boolean }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showMyLocation, setShowMyLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, TranslationState | undefined>>({});
  const [viewerLang, setViewerLang] = useState("en");
  const [reportTarget, setReportTarget] = useState<CommentType | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [myReports, setMyReports] = useState<Set<string>>(() => getMyReports());
  const [flagged, setFlagged] = useState<FlaggedComment[]>([]);
  const [flaggedOpen, setFlaggedOpen] = useState(false);
  const [flaggedBusy, setFlaggedBusy] = useState<string | null>(null);
  const { user, emailVerified } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setViewerLang(getPreferredLang());
  }, []);

  useEffect(() => {
    setLoading(true);
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    if (!isOwner || !videoId || typeof videoId !== "string") return;
    loadFlagged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, isOwner]);

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

  const loadFlagged = async () => {
    try {
      const res = await axiosInstance.get(`/comment/flagged/${videoId}`);
      setFlagged(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message || fallback;

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        commentbody: newComment,
        showLocation: showMyLocation,
      });
      if (res.data?._id) {
        setComments([res.data, ...comments]);
        setNewComment("");
        setShowMyLocation(false);
      }
    } catch (error: any) {
      toast.error(
        getErrorMessage(error, "Could not post your comment. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editText.trim() || !editingCommentId) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId
              ? { ...c, commentbody: editText, language: res.data.language }
              : c
          )
        );
        setTranslations((prev) => ({ ...prev, [editingCommentId]: undefined }));
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Could not update your comment."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
        setFlagged((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Could not delete the comment."));
    }
  };

  const applyEngagement = (c: CommentType, data: any) => {
    if (!user) return;
    setComments((prev) =>
      prev.map((x) => {
        if (x._id !== c._id) return x;
        const likes = data.liked
          ? [...(x.likes || []).filter((u) => u !== user._id), user._id]
          : (x.likes || []).filter((u) => u !== user._id);
        const dislikes = data.disliked
          ? [...(x.dislikes || []).filter((u) => u !== user._id), user._id]
          : (x.dislikes || []).filter((u) => u !== user._id);
        return { ...x, likes, dislikes };
      })
    );
  };

  const handleToggleLike = async (c: CommentType) => {
    if (!user || pendingId === c._id) return;
    setPendingId(c._id);
    try {
      const res = await axiosInstance.post(`/comment/like/${c._id}`);
      applyEngagement(c, res.data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Action failed."));
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleDislike = async (c: CommentType) => {
    if (!user || pendingId === c._id) return;
    setPendingId(c._id);
    try {
      const res = await axiosInstance.post(`/comment/dislike/${c._id}`);
      applyEngagement(c, res.data);
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Action failed."));
    } finally {
      setPendingId(null);
    }
  };

  const handleReport = async () => {
    if (!reportTarget || !user) return;
    try {
      const res = await axiosInstance.post(`/comment/report/${reportTarget._id}`, {
        reason: reportReason,
      });
      if (res.data?.reported) {
        const next = new Set(myReports).add(reportTarget._id);
        setMyReports(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "yourtube-reported-comments",
            JSON.stringify([...next])
          );
        }
        setComments((prev) =>
          prev.map((x) =>
            x._id === reportTarget._id ? { ...x, isFlagged: true } : x
          )
        );
        toast.success("Report submitted. The channel owner will review it.");
        if (isOwner) loadFlagged();
      }
      setReportTarget(null);
      setReportReason("");
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Could not submit your report."));
    }
  };

  const handleTranslate = async (c: CommentType) => {
    const existing = translations[c._id];
    if (existing) {
      setTranslations((prev) => ({
        ...prev,
        [c._id]: { ...existing, visible: !existing.visible },
      }));
      return;
    }
    setTranslations((prev) => ({
      ...prev,
      [c._id]: { text: "", source: "", target: viewerLang, visible: true },
    }));
    try {
      const res = await axiosInstance.post("/comment/translate", {
        text: c.commentbody,
        target: viewerLang,
      });
      const detected = res.data.detectedSource;
      if (detected && detected === viewerLang) {
        setTranslations((prev) => ({ ...prev, [c._id]: undefined }));
        const langName =
          LANGUAGES.find((l) => l.value === viewerLang)?.label || viewerLang;
        toast.info(`This comment is already in ${langName}.`);
        return;
      }
      setTranslations((prev) => ({
        ...prev,
        [c._id]: {
          text: res.data.translatedText,
          source: detected,
          target: viewerLang,
          visible: true,
        },
      }));
    } catch (error: any) {
      setTranslations((prev) => ({ ...prev, [c._id]: undefined }));
      toast.error(getErrorMessage(error, "Translation failed. Try again."));
    }
  };

  const handleViewerLangChange = (lang: string) => {
    setViewerLang(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("yourtube-comment-lang", lang);
    }
    setTranslations({});
  };

  const handleApprove = async (id: string) => {
    setFlaggedBusy(id);
    try {
      await axiosInstance.post(`/comment/approve/${id}`);
      setFlagged((prev) => prev.filter((c) => c._id !== id));
      setComments((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isFlagged: false } : c))
      );
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Could not approve the comment."));
    } finally {
      setFlaggedBusy(null);
    }
  };

  const handleDeleteFlagged = async (id: string) => {
    setFlaggedBusy(id);
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setFlagged((prev) => prev.filter((c) => c._id !== id));
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Could not delete the comment."));
    } finally {
      setFlaggedBusy(null);
    }
  };

  const likedByMe = useCallback(
    (c: CommentType) => !!user && (c.likes || []).includes(user._id),
    [user]
  );
  const dislikedByMe = useCallback(
    (c: CommentType) => !!user && (c.dislikes || []).includes(user._id),
    [user]
  );
  const reportedByMe = useCallback(
    (c: CommentType) => myReports.has(c._id),
    [myReports]
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="h-6 w-32 bg-gray-200 rounded animate-skeleton dark:bg-gray-700" />
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-skeleton dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-20 bg-gray-200 rounded animate-skeleton dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {comments.length} Comments
        </h2>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Languages className="w-3.5 h-3.5" />
          Translate to
          <select
            value={viewerLang}
            onChange={(e) => handleViewerLangChange(e.target.value)}
            className="bg-transparent border rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isOwner && flagged.length > 0 && (
        <div className="border border-red-300/60 bg-red-50 dark:bg-red-950/40 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-red-700 dark:text-red-400"
            onClick={() => setFlaggedOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              {flagged.length} flagged comment{flagged.length > 1 ? "s" : ""} need
              review
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${flaggedOpen ? "rotate-180" : ""}`}
            />
          </button>
          {flaggedOpen && (
            <div className="divide-y divide-red-200/60 dark:divide-red-900">
              {flagged.map((c) => (
                <div key={c._id} className="px-4 py-3 space-y-2">
                  <p className="text-sm">{c.commentbody}</p>
                  <p className="text-xs text-muted-foreground">
                    by {c.usercommented} ·{" "}
                    {(c.reports || []).length} report
                    {(c.reports || []).length === 1 ? "" : "s"}
                    {(c.reports || []).some((r) => r.reason)
                      ? ` · ${(c.reports || [])
                          .map((r) => r.reason)
                          .filter(Boolean)
                          .slice(0, 3)
                          .join(", ")}`
                      : ""}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={flaggedBusy === c._id}
                      onClick={() => handleApprove(c._id)}
                    >
                      {flaggedBusy === c._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Keep
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={flaggedBusy === c._id}
                      onClick={() => handleDeleteFlagged(c._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {user && !emailVerified && (
        <p className="text-sm text-amber-700 bg-amber-50 border rounded-lg px-3 py-2">
          Verify your email to post comments.
        </p>
      )}

      {user && emailVerified && (
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMyLocation}
                  onChange={(e) => setShowMyLocation(e.target.checked)}
                  className="accent-current"
                />
                Show my location
              </label>
              <div className="flex gap-2">
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
        </div>
      )}

      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const translation = translations[comment._id];
            const mine = user && comment.userid === user._id;
            return (
              <div key={comment._id} className="flex gap-4 animate-fade-up">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarFallback className="text-sm">
                    {comment.usercommented?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">
                      {comment.usercommented}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {safeDate(comment.commentedon) ? (
                        <>
                          {formatDistanceToNow(safeDate(comment.commentedon)!)} ago
                        </>
                      ) : null}
                    </span>
                    {comment.language && (
                      <span className="text-[10px] uppercase tracking-wide bg-secondary px-1.5 py-0.5 rounded">
                        {comment.language}
                      </span>
                    )}
                    {comment.showLocation && comment.location?.city && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {comment.location.city}
                        {comment.location.state ? `, ${comment.location.state}` : ""}
                      </span>
                    )}
                  </div>

                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm min-h-[60px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={handleUpdateComment}
                          disabled={!editText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {comment.commentbody}
                      </p>
                      {translation?.visible && (
                        <p className="mt-1 text-sm text-muted-foreground border-l-2 pl-2 break-words">
                          {translation.text}
                          <span className="ml-2 text-[10px] uppercase tracking-wide">
                            translated{translation.source ? ` · detected ${translation.source}` : ""}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        {user && (
                          <>
                            <button
                              className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                                likedByMe(comment) ? "text-blue-600 dark:text-blue-400 font-medium" : ""
                              }`}
                              onClick={() => handleToggleLike(comment)}
                              disabled={pendingId === comment._id}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              {(comment.likes || []).length || ""}
                            </button>
                            <button
                              className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                                dislikedByMe(comment) ? "text-red-600 dark:text-red-400 font-medium" : ""
                              }`}
                              onClick={() => handleToggleDislike(comment)}
                              disabled={pendingId === comment._id}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              {(comment.dislikes || []).length || ""}
                            </button>
                            {!mine && !reportedByMe(comment) && (
                              <button
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                                onClick={() => setReportTarget(comment)}
                              >
                                <Flag className="w-3.5 h-3.5" />
                                Report
                              </button>
                            )}
                            {mine && !reportedByMe(comment) && comment.isFlagged && (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <Flag className="w-3.5 h-3.5" />
                                Flagged for review
                              </span>
                            )}
                          </>
                        )}
                        {user && (
                          <button
                            className={`flex items-center gap-1 transition-colors ${
                              translation?.visible
                                ? "text-blue-600 dark:text-blue-400 font-medium"
                                : "hover:text-foreground"
                            }`}
                            onClick={() => handleTranslate(comment)}
                            disabled={translation && !translation.text && translation.visible}
                          >
                            {translation && !translation.text && translation.visible ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Languages className="w-3.5 h-3.5" />
                            )}
                            {translation?.visible
                              ? "Hide translation"
                              : `Translate${viewerLang !== "en" ? ` to ${viewerLang}` : ""}`}
                          </button>
                        )}
                        {mine && (
                          <>
                            <button
                              className="hover:text-black dark:hover:text-white transition-colors font-medium"
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditText(comment.commentbody);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="hover:text-red-600 transition-colors font-medium"
                              onClick={() => handleDelete(comment._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this comment</DialogTitle>
            <DialogDescription>
              Tell us what's wrong with this comment. The channel owner will
              review your report.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="min-h-[70px] resize-none text-sm"
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setReportTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleReport}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Comments;
