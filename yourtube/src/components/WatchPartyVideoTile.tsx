"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function WatchPartyVideoTile({
  stream,
  name,
  muted,
  mirrored,
  showFullscreen = true,
}: {
  stream: MediaStream | undefined | null;
  name: string;
  muted: boolean;
  mirrored?: boolean;
  showFullscreen?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream ?? null;
    }
  }, [stream]);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-border group"
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${mirrored ? "-scale-x-100" : ""}`}
      />
      <span className="absolute bottom-1 left-1.5 text-[10px] text-white/80 bg-black/50 px-1 py-0.5 rounded max-w-[80%] truncate">
        {name}
      </span>
      {showFullscreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          className="absolute top-1 right-1 h-7 w-7 items-center justify-center rounded-md bg-black/50 text-white/90 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 flex"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}