"use client";
import { useState } from "react";
import { getVideoUrl } from "@/lib/cloudinary";
import { formatDuration } from "@/lib/videoUtils";

export default function VideoThumb({
  filepath,
  thumbnail,
  duration,
}: {
  filepath?: string;
  thumbnail?: string;
  duration?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [metaDuration, setMetaDuration] = useState<number | null>(null);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setMetaDuration(e.currentTarget.duration);
  };

  const effectiveDuration = duration && duration > 0 ? duration : metaDuration;
  const formatted = formatDuration(effectiveDuration);
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
      {formatted && (
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[11px] px-1 rounded font-medium">
          {formatted}
        </div>
      )}
    </div>
  );
}
