"use client";
import { useState } from "react";
import { getVideoUrl } from "@/lib/cloudinary";
import DurationBadge from "./ui/duration-badge";
import WatchProgressBar from "./WatchProgressBar";

export default function VideoThumb({
  filepath,
  thumbnail,
  duration,
  videoId,
}: {
  filepath?: string;
  thumbnail?: string;
  duration?: number;
  videoId?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [metaDuration, setMetaDuration] = useState<number | null>(null);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setMetaDuration(e.currentTarget.duration);
  };

  const effectiveDuration = duration && duration > 0 ? duration : metaDuration;
  const showImage = !!thumbnail && !imgFailed;

  return (
    <div className="relative w-full h-full">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getVideoUrl(thumbnail)}
          alt=""
          className="object-cover w-full h-full"
          onError={() => setImgFailed(true)}
        />
      ) : !error ? (
        <video
          src={getVideoUrl(filepath)}
          className={`object-cover w-full h-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoadedData={() => setLoaded(true)}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setError(true)}
          muted
          preload="metadata"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground text-xs">
          Unavailable
        </div>
      )}
      <DurationBadge seconds={effectiveDuration} className="bottom-1 right-1" />
      <WatchProgressBar videoId={videoId} duration={effectiveDuration} />
    </div>
  );
}
