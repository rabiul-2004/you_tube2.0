"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, X, ThumbsUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import VideoThumb from "./VideoThumb";
import { safeDate } from "@/lib/videoUtils";

export default function LikedVideosContent() {
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadLikedVideos();
    }
  }, [user?._id]);

  const loadLikedVideos = async () => {
    if (!user) return;

    try {
      const likedData = await axiosInstance.get(`/like/${user?._id}`);

      setLikedVideos(likedData.data);
    } catch (error) {
      console.error("Error loading liked videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlikeVideo = async (videoId: string, likedVideoId: string) => {
    if (!user) return;

    try {
      await axiosInstance.delete(`/like/remove/${likedVideoId}`);
      setLikedVideos((prev) => prev.filter((item) => item._id !== likedVideoId));
    } catch (error) {
      console.error("Error unliking video:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Keep track of videos you like
        </h2>
        <p className="text-muted-foreground">Sign in to see your liked videos.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading liked videos...</div>;
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No liked videos yet</h2>
        <p className="text-muted-foreground">Videos you like will appear here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{likedVideos.length} videos</p>
        <Button className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          Play all
        </Button>
      </div>

      <div className="space-y-4">
        {likedVideos.filter((item) => item.videoid).map((item) => (
          <div key={item._id} className="flex gap-4 group">
            <Link href={`/watch/${item.videoid._id}`} className="flex-shrink-0">
              <div className="relative w-40 aspect-video bg-secondary rounded overflow-hidden">
                <VideoThumb filepath={item.videoid?.filepath} thumbnail={item.videoid?.thumbnail} duration={item.videoid?.duration} />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watch/${item.videoid._id}`}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {item.videoid.videotitle}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">
                {item.videoid.videochanel}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.videoid.views.toLocaleString()} views •{" "}
                {safeDate(item.videoid.createdAt) ? <>{formatDistanceToNow(safeDate(item.videoid.createdAt)!)} ago</> : null}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Liked {safeDate(item.createdAt) ? <>{formatDistanceToNow(safeDate(item.createdAt)!)} ago</> : null}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleUnlikeVideo(item.videoid._id, item._id)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove from liked videos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
