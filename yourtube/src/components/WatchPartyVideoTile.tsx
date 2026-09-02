"use client";

import { useEffect, useRef } from "react";

export default function WatchPartyVideoTile({
  stream,
  name,
  muted,
  mirrored,
}: {
  stream: MediaStream | undefined | null;
  name: string;
  muted: boolean;
  mirrored?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream ?? null;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-border">
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
    </div>
  );
}