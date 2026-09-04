import Link from "next/link";
import VideoThumb from "./VideoThumb";
import { relativeTime } from "@/lib/videoUtils";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochanel: string;
    filepath?: string;
    thumbnail?: string;
    duration?: number;
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
            <div className="relative w-40 aspect-video bg-secondary rounded-lg overflow-hidden flex-shrink-0">
              <VideoThumb filepath={video.filepath} thumbnail={video.thumbnail} duration={video.duration} videoId={video._id} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 leading-5 group-hover:text-blue-600 transition-colors">
                {video.videotitle}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">{video.videochanel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {video.views?.toLocaleString()} views •{" "}
                {relativeTime(video.createdAt)}
              </p>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-sm text-muted-foreground/70 px-1">No related videos</p>
      )}
    </div>
  );
}
