"use client";
import { useState } from "react";
import { BASE_URL } from "@/lib/axiosinstance";
import { formatDuration } from "@/lib/videoUtils";

export default function VideoThumb({ filepath }: { filepath?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
  };

  const formatted = formatDuration(duration);

  return (
    <div className="relative w-full h-full">
      {!error ? (
        <video
          src={`${BASE_URL}/${filepath}`}
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
