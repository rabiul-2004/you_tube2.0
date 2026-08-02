import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchX } from "lucide-react";
import VideoThumb from "./VideoThumb";

const SearchResult = ({ query }: any) => {
  const [video, setvideos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query?.trim()) {
      setvideos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      const allVideos = [
        {
          _id: "1",
          videotitle: "Amazing Nature Documentary",
          filename: "nature-doc.mp4",
          filetype: "video/mp4",
          filepath: "/videos/nature-doc.mp4",
          filesize: "500MB",
          videochanel: "Nature Channel",
          Like: 1250,
          views: 45000,
          uploader: "nature_lover",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          videotitle: "Cooking Tutorial: Perfect Pasta",
          filename: "pasta-tutorial.mp4",
          filetype: "video/mp4",
          filepath: "/videos/pasta-tutorial.mp4",
          filesize: "300MB",
          videochanel: "Chef's Kitchen",
          Like: 890,
          views: 23000,
          uploader: "chef_master",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      const results = allVideos.filter(
        (vid) =>
          vid.videotitle.toLowerCase().includes(query.toLowerCase()) ||
          vid.videochanel.toLowerCase().includes(query.toLowerCase())
      );
      setvideos(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!query?.trim()) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <SearchX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Enter a search term to find videos and channels.</p>
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

  if (!video || video.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <SearchX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-gray-500">Try different keywords or remove search filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="space-y-4">
        {video.map((video: any) => (
          <div key={video._id} className="flex flex-col sm:flex-row gap-4 group">
            <Link href={`/watch/${video._id}`} className="flex-shrink-0">
              <div className="relative w-full sm:w-80 aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <VideoThumb filepath={video.filepath} />
              </div>
            </Link>

            <div className="flex-1 min-w-0 py-1">
              <Link href={`/watch/${video._id}`}>
                <h3 className="font-medium text-base sm:text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
                  {video.videotitle}
                </h3>
              </Link>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>{video.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
              </div>

              <Link
                href={`/channel/${video.uploader}`}
                className="flex items-center gap-2 mb-2 hover:text-blue-600 transition-colors w-fit"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" />
                  <AvatarFallback className="text-xs">{video.videochanel[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">{video.videochanel}</span>
              </Link>

              <p className="text-sm text-gray-600 line-clamp-2">
                Sample video description that would show search-relevant content
                and help users understand what the video is about before clicking.
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-8 border-t">
        <p className="text-sm text-gray-500">
          Showing {video.length} result{video.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
        </p>
      </div>
    </div>
  );
};

export default SearchResult;
