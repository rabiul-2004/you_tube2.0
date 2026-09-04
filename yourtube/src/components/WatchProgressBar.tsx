"use client";

import { useVideoProgress } from "@/lib/useVideoProgress";

/**
 * Red progress bar drawn along the bottom of a video thumbnail showing how
 * far the signed-in user has watched. Progress is loaded (and cached) from
 * the watch-progress endpoint the first time each video is shown.
 */
export default function WatchProgressBar({
  videoId,
  duration,
}: {
  videoId?: string;
  duration?: number | null;
}) {
  const { position, loaded } = useVideoProgress(videoId);

  if (!loaded || !position || position <= 3 || !duration || duration <= 0) {
    return null;
  }

  const percent = Math.min(100, (position / duration) * 100);
  // Don't draw a bar when the video is effectively finished.
  if (percent >= 99.5) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
      <div
        className="h-full bg-red-600"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
