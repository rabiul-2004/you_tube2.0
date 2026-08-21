"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { getVideoUrl } from "@/lib/cloudinary";
import { safeDate } from "@/lib/videoUtils";
import VideoThumb from "./VideoThumb";

export default function DownloadsContent() {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadDownloads();
    } else {
      setDownloads([]);
      setLoading(false);
    }
  }, [user?._id]);

  const loadDownloads = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/download/history/${user._id}`);
      setDownloads(res.data);
    } catch (error) {
      console.error("Error loading downloads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (downloadId: string) => {
    try {
      await axiosInstance.delete(`/download/${downloadId}`);
      setDownloads((prev) => prev.filter((d) => d._id !== downloadId));
    } catch (error) {
      console.error("Error removing download:", error);
    }
  };

  const handleDownloadFile = (item: any) => {
    const url = getVideoUrl(item.video?.filepath);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.video?.videotitle || "video";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!user) {
    return (
      <div className="text-center py-12 animate-fade-up">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No downloads yet</h2>
        <p className="text-muted-foreground">
          Sign in to see your downloaded videos.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-fade-up">
            <div className="w-40 aspect-video bg-gray-200 rounded-lg animate-skeleton" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded animate-skeleton w-2/3" />
              <div className="h-3 bg-gray-200 rounded animate-skeleton w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-up">
        <Download className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No downloads yet</h2>
        <p className="text-muted-foreground">
          Videos you download will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{downloads.length} downloads</p>
      </div>

      <div className="space-y-4">
        {downloads.filter((item) => item.video).map((item) => (
          <div key={item._id} className="flex gap-4 group">
            <Link href={`/watch/${item.video._id}`} className="flex-shrink-0">
              <div className="relative w-40 aspect-video bg-secondary rounded overflow-hidden">
                <VideoThumb filepath={item.video?.filepath} />
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/watch/${item.video._id}`}>
                <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 mb-1">
                  {item.video.videotitle}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground">{item.video.videochanel}</p>
              <p className="text-sm text-muted-foreground">
                {item.video.views?.toLocaleString()} views
                {safeDate(item.video?.createdAt) && <> • {formatDistanceToNow(safeDate(item.video.createdAt)!)} ago</>}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Downloaded {safeDate(item.createdAt) ? <>{formatDistanceToNow(safeDate(item.createdAt)!)} ago</> : "recently"} • {item.plan}
              </p>
            </div>

            <div className="flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleDownloadFile(item)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRemove(item._id)}>
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
