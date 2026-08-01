"use client";

import { useRef, useState, useEffect } from "react";
import { BASE_URL } from "@/lib/axiosinstance";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const el = videoRef.current;
    if (el) {
      el.load();
    }
  }, [video?._id, video?.filepath]);

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
      {!loaded && (
        <div className="absolute inset-0 animate-skeleton" />
      )}
      <video
        key={video?._id}
        ref={videoRef}
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        controls
        onLoadedData={() => setLoaded(true)}
      >
        <source
          src={`${BASE_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
