import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useSubscribe } from "@/lib/useSubscribe";
import { formatCount } from "@/lib/formatCount";
import Link from "next/link";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const channelId = video.uploader;
  const isOwner = user && channelId && user._id === channelId;
  const { subscribed, count, loading, toggle } = useSubscribe(channelId);

  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video._id]);

  const viewCountedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !video._id) return;
    if (viewCountedRef.current === video._id) return;

    const cooldownKey = `viewCooldown:${video._id}`;
    const lastView = localStorage.getItem(cooldownKey);
    const cooldownMs = Math.max((video.duration || 0), 30) * 1000;
    if (lastView && cooldownMs > 0 && Date.now() - Number(lastView) < cooldownMs) {
      viewCountedRef.current = video._id;
      return;
    }

    viewCountedRef.current = video._id;
    axiosInstance
      .post(`/history/${video._id}`, { userId: user._id })
      .then(() => {
        localStorage.setItem(cooldownKey, String(Date.now()));
      })
      .catch((error) => console.log(error));
  }, [user?._id, video._id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleWatchLater = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/dislike/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.disliked) {
        if (isDisliked) {
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        } else {
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: video.videotitle,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={channelId ? `/channel/${channelId}` : "#"}>
            <Avatar className="w-10 h-10">
              <AvatarFallback>{video.videochanel?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={channelId ? `/channel/${channelId}` : "#"}>
              <h3 className="font-medium text-sm hover:underline">
                {video.videochanel}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground">
              {formatCount(count)} subscribers
            </p>
          </div>
          {user && !isOwner && (
            <Button
              className="ml-2 h-9 text-sm"
              variant={subscribed ? "outline" : "default"}
              onClick={toggle}
              disabled={loading}
            >
              {loading ? "..." : subscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-secondary rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full gap-1.5 text-sm h-9 px-3"
              onClick={handleLike}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-black text-black" : ""}`} />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-5 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full h-9 px-3"
              onClick={handleDislike}
            >
              <ThumbsDown className={`w-4 h-4 ${isDisliked ? "fill-black text-black" : ""}`} />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-secondary rounded-full gap-1.5 text-sm h-9 ${isWatchLater ? "text-primary" : ""}`}
            onClick={handleWatchLater}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{isWatchLater ? "Saved" : "Watch Later"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-secondary rounded-full gap-1.5 text-sm h-9"
            onClick={handleShare}
          >
            <Share className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="ghost" size="sm" className="bg-secondary rounded-full text-sm h-9 px-3">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="bg-secondary rounded-full h-9 w-9">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-4 transition-all duration-200 hover:bg-secondary/70">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video.views?.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm text-foreground/70 ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>{video.description || "No description"}</p>
        </div>
        <button
          className="mt-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </button>
      </div>
    </div>
  );
};

export default VideoInfo;
