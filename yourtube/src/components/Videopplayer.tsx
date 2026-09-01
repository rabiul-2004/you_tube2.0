"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getVideoUrl } from "@/lib/cloudinary";
import { formatDuration } from "@/lib/videoUtils";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  SkipForward,
  Loader2,
} from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
    thumbnail?: string;
  };
  nextVideo?: { _id: string; videotitle: string } | null;
  onNextVideo?: (id: string) => void;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getPosition: () => number;
  isPlaying: () => boolean;
}

export default forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { video, nextVideo, onNextVideo },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<
    "forward" | "backward" | null
  >(null);
  const [showVolume, setShowVolume] = useState(false);
  const lastTap = useRef<{ time: number; clientX: number } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetVideoState = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setLoading(true);
    setDoubleTapFeedback(null);
  }, []);

  useEffect(() => {
    resetVideoState();
    const el = videoRef.current;
    if (el) {
      el.load();
    }
  }, [video?._id, video?.filepath, resetVideoState]);

  // Attempt autoplay when video metadata loads
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const attemptAutoplay = async () => {
      try {
        // Try to play with sound first (will work if user interacted with page before)
        el.muted = false;
        await el.play();
        setMuted(false);
        setPlaying(true);
      } catch {
        // If blocked, play muted (always allowed)
        el.muted = true;
        await el.play();
        setMuted(true);
        setPlaying(true);
      }
    };

    if (el.readyState >= 1) { // HAVE_METADATA
      attemptAutoplay();
    } else {
      const handleLoadedMetadata = () => {
        attemptAutoplay();
        el.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
      el.addEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, [video?._id, video?.filepath]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [playing]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        videoRef.current?.play();
        showControlsTemporarily();
      },
      pause: () => {
        videoRef.current?.pause();
        setControlsVisible(true);
      },
      seekTo: (seconds: number) => {
        const el = videoRef.current;
        if (!el) return;
        el.currentTime = Math.min(Math.max(seconds, 0), el.duration || 0);
        setCurrentTime(el.currentTime);
        showControlsTemporarily();
      },
      getPosition: () => videoRef.current?.currentTime ?? 0,
      isPlaying: () => !videoRef.current?.paused,
    }),
    [showControlsTemporarily]
  );

  const seekBy = useCallback(
    (seconds: number) => {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = Math.min(
        Math.max(el.currentTime + seconds, 0),
        el.duration || 0
      );
      setCurrentTime(el.currentTime);
      showControlsTemporarily();
    },
    [showControlsTemporarily]
  );

  const handleDoubleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      const rect = container.getBoundingClientRect();
      const isLeft = clientX < rect.left + rect.width / 2;

      const now = Date.now();
      const prev = lastTap.current;
      lastTap.current = { time: now, clientX };

      if (prev && now - prev.time < 300) {
        const direction = isLeft ? "backward" : "forward";
        seekBy(isLeft ? -10 : 10);
        setDoubleTapFeedback(direction);
        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(
          () => setDoubleTapFeedback(null),
          600
        );
      }
    },
    [seekBy]
  );

  // Touch event handlers for mobile double-tap
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleDoubleTap(e);
    }
  }, [handleDoubleTap]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && now - prev.time < 300) {
      e.preventDefault();
    }
  }, []);

  const seekTo = useCallback(
    (percent: number) => {
      const el = videoRef.current;
      if (!el || !duration) return;
      el.currentTime = (percent / 100) * duration;
      setCurrentTime(el.currentTime);
      showControlsTemporarily();
    },
    [duration, showControlsTemporarily]
  );

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleVolumeChange = useCallback(
    (value: number) => {
      const el = videoRef.current;
      if (!el) return;
      el.volume = value;
      el.muted = value === 0;
      setVolume(value);
      setMuted(el.muted);
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleProgress = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.buffered.length) return;
    const end = el.buffered.end(el.buffered.length - 1);
    setBuffered(end);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "j":
        case "J":
          e.preventDefault();
          seekBy(-10);
          break;
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault();
          seekBy(10);
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay, seekBy, toggleMute, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const volumePercent = (muted ? 0 : volume) * 100;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video bg-black rounded-xl overflow-hidden select-none"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (playing) setControlsVisible(false);
      }}
    >
      <video
        key={video?._id}
        ref={videoRef}
        className="w-full h-full object-contain"
        src={getVideoUrl(video?.filepath)}
        poster={video?.thumbnail ? getVideoUrl(video.thumbnail) : undefined}
        playsInline
        muted
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPlay={() => {
          setPlaying(true);
          showControlsTemporarily();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
          if (nextVideo?._id) {
            onNextVideo?.(nextVideo._id);
          }
        }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-14 h-14 text-white animate-spin" />
        </div>
      )}

      {!playing && !loading && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/20 transition-colors"
          onClick={togglePlay}
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-105">
            <Play className="w-10 h-10 text-white fill-white" />
          </div>
        </button>
      )}

      {doubleTapFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`flex items-center gap-2 bg-black/70 rounded-full px-5 py-3 animate-scale-in ${
              doubleTapFeedback === "forward" ? "" : "flex-row-reverse"
            }`}
          >
            {doubleTapFeedback === "forward" ? (
              <RotateCw className="w-6 h-6 text-white" />
            ) : (
              <RotateCcw className="w-6 h-6 text-white" />
            )}
            <span className="text-white font-medium text-sm">10s</span>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-10 pb-3 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative h-1.5 mb-2.5">
          <div className="absolute inset-0 bg-white/30 rounded-full" />
          <div
            className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={progressPercent}
            step={0.1}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-white">
          <button
            onClick={togglePlay}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white" />
            )}
          </button>

          <button
            onClick={() => seekBy(-10)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => seekBy(10)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <div
            className="flex items-center"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              onClick={toggleMute}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <div
              className={`w-0 overflow-hidden transition-all duration-300 ${
                showVolume ? "w-20" : ""
              }`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 accent-white"
                aria-label="Volume"
              />
            </div>
          </div>

          <span className="text-xs font-medium ml-1 whitespace-nowrap">
            {formatDuration(currentTime) ?? "0:00"}
            <span className="text-white/60"> / {formatDuration(duration) ?? "0:00"}</span>
          </span>

          <div className="flex-1" />

          {nextVideo && (
            <button
              onClick={() => onNextVideo?.(nextVideo._id)}
              className="hidden sm:flex items-center gap-1.5 p-1.5 hover:bg-white/20 rounded-full transition-colors text-xs font-medium"
              title={`Next: ${nextVideo.videotitle}`}
            >
              <span className="max-w-[160px] truncate">{nextVideo.videotitle}</span>
              <SkipForward className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
