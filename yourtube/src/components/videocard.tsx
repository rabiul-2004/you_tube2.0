"use client";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { getVideoUrl } from "@/lib/cloudinary";
import { relativeTime } from "@/lib/videoUtils";
import { useState, useRef, useEffect } from "react";
import DurationBadge from "./ui/duration-badge";

export default function VideoCard({ video }: any) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.load();
    }
  }, [isInView]);

  return (
    <Link
      href={`/watch/${video?._id}`}
      className="group block w-full min-w-0 animate-fade-up"
    >
        <div ref={containerRef} className="space-y-3 w-full min-w-0 pb-2 sm:pb-3">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
            {video?.thumbnail ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getVideoUrl(video.thumbnail)}
                  alt=""
                  className={`object-cover w-full h-full min-w-0 group-hover:scale-105 transition-transform duration-500 ${
                    thumbLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setThumbLoaded(true)}
                  onError={() => setThumbError(true)}
                />
                {thumbLoaded && !thumbError && (
                  <DurationBadge seconds={video.duration} className="bottom-1.5 right-1.5" />
                )}
              </>
            ) : !error ? (
              <>
                <video
                  ref={videoRef}
                  src={getVideoUrl(video?.filepath)}
                  className={`object-cover w-full h-full min-w-0 group-hover:scale-105 transition-transform duration-500 ${
                    loaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoadedData={() => setLoaded(true)}
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={() => setError(true)}
                  muted
                  preload={isInView ? "metadata" : "none"}
                  playsInline
                />
                {!loaded && !error && (
                  <div className="absolute inset-0 animate-skeleton" />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground text-sm">
                Video unavailable
              </div>
            )}
            {!video?.thumbnail && (
              <DurationBadge seconds={duration} className="bottom-1.5 right-1.5" />
            )}
          </div>
        <div className="flex gap-2 sm:gap-3 px-0.5 sm:px-1">
          <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5 hidden sm:flex">
            {video?.videochanelImage && (
              <AvatarImage src={video.videochanelImage} alt={video?.videochanel} />
            )}
            <AvatarFallback className="text-sm">{video?.videochanel?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[13px] sm:text-sm line-clamp-2 leading-4 sm:leading-5 group-hover:text-blue-600 transition-colors duration-200 break-words">
              {video?.videotitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate hover:text-foreground transition-colors">
              {video?.videochanel}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {video?.views?.toLocaleString()} views • {relativeTime(video?.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
