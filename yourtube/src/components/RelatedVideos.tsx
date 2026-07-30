import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BASE_URL } from "@/lib/axiosinstance";
import { useState } from "react";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochanel: string;
    filepath?: string;
    views: number;
    createdAt: string;
  }>;
}

export default function RelatedVideos({ videos }: RelatedVideosProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm px-1">Related videos</h3>
      {videos?.length > 0 ? (
        videos.map((video) => (
          <Link
            key={video._id}
            href={`/watch/${video._id}`}
            className="flex gap-2 group"
          >
            <div className="relative w-40 aspect-video bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <video
                src={`${BASE_URL}/${video?.filepath}`}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                muted
                preload="metadata"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 leading-5 group-hover:text-blue-600 transition-colors">
                {video.videotitle}
              </h4>
              <p className="text-xs text-gray-600 mt-1">{video.videochanel}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {video.views?.toLocaleString()} views •{" "}
                {formatDistanceToNow(new Date(video.createdAt))} ago
              </p>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-sm text-gray-500 px-1">No related videos</p>
      )}
    </div>
  );
}
