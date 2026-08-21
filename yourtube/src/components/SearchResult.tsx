import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchX } from "lucide-react";
import VideoThumb from "./VideoThumb";
import axiosInstance from "@/lib/axiosinstance";
import { safeDate } from "@/lib/videoUtils";

const SearchResult = ({ query }: any) => {
  const [videos, setVideos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query?.trim()) {
      setVideos([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const run = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        if (cancelled) return;
        const q = query.trim().toLowerCase();
        const results = (res.data || []).filter(
          (vid: any) =>
            (vid.videotitle && vid.videotitle.toLowerCase().includes(q)) ||
            (vid.videochanel && vid.videochanel.toLowerCase().includes(q))
        );
        setVideos(results);
      } catch (error) {
        console.error("Error fetching videos for search:", error);
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeout = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  if (!query?.trim()) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <SearchX className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Enter a search term to find videos and channels.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-fade-up">
            <div className="w-80 aspect-video bg-gray-200 rounded-lg animate-skeleton flex-shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 bg-gray-200 rounded animate-skeleton w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-skeleton w-1/3" />
              <div className="h-4 bg-gray-200 rounded animate-skeleton w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <SearchX className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-muted-foreground">Try different keywords or remove search filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-4">
        {videos.map((video: any) => (
          <div key={video._id} className="flex flex-col sm:flex-row gap-4 group">
            <Link href={`/watch/${video._id}`} className="flex-shrink-0">
              <div className="relative w-full sm:w-80 aspect-video bg-secondary rounded-lg overflow-hidden">
                <VideoThumb filepath={video.filepath} />
              </div>
            </Link>

            <div className="flex-1 min-w-0 py-1">
              <Link href={`/watch/${video._id}`}>
                <h3 className="font-medium text-base sm:text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-1 break-words">
                  {video.videotitle}
                </h3>
              </Link>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>{video.views?.toLocaleString() || 0} views</span>
                <span>•</span>
                <span>{safeDate(video.createdAt) ? <>{formatDistanceToNow(safeDate(video.createdAt)!)} ago</> : null}</span>
              </div>

              <Link
                href={`/channel/${video.uploader}`}
                className="flex items-center gap-2 mb-2 hover:text-blue-600 transition-colors w-fit"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" />
                  <AvatarFallback className="text-xs">{video.videochanel?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{video.videochanel}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-8 border-t">
        <p className="text-sm text-muted-foreground">
          Showing {videos.length} result{videos.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default SearchResult;
