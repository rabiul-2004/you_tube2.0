"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { useUser } from "./AuthContext";

const SAVE_INTERVAL_MS = 5000;

/**
 * Tracks a signed-in user's watch progress for a video.
 * Loads any saved position on mount and periodically saves (and on pause /
 * page unload / unmount) so a user can resume where they left off.
 */
export function useWatchProgress(
  videoId: string | undefined,
  saveEnabled = true
) {
  const { user } = useUser();
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const positionRef = useRef(0);
  const lastSavedRef = useRef<number | null>(null);
  const loadedVideoRef = useRef<string | null>(null);

  // Load the saved position whenever the video changes (once per video).
  useEffect(() => {
    if (!videoId || !user || loadedVideoRef.current === videoId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/progress/${videoId}`);
        if (!cancelled) {
          const pos = res.data?.progress?.position;
          if (typeof pos === "number" && pos > 3) {
            setSavedPosition(pos);
          } else {
            setSavedPosition(null);
          }
          lastSavedRef.current = typeof pos === "number" ? pos : null;
        }
      } catch {
        if (!cancelled) setSavedPosition(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoId, user]);

  const setPosition = useCallback((pos: number) => {
    positionRef.current = pos;
  }, []);

  const setVideoDuration = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const save = useCallback(
    async (videoIdToSave?: string) => {
      const vid = videoIdToSave ?? videoId;
      if (!vid || !user) return;
      const pos = Math.floor(positionRef.current);
      if (pos <= 3) return; // near the start — nothing worth resuming
      if (lastSavedRef.current !== null && Math.abs(pos - lastSavedRef.current) < 2) {
        return; // avoid redundant writes
      }
      try {
        await axiosInstance.post(`/progress/${vid}`, {
          position: pos,
          duration,
        });
        lastSavedRef.current = pos;
      } catch {
        // silent — progress saves are best-effort
      }
    },
    [videoId, user, duration]
  );

  // Periodic save while watching.
  useEffect(() => {
    if (!videoId || !user) return;
    if (!saveEnabled) return;
    const iv = setInterval(() => save(videoId), SAVE_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [videoId, user, save, saveEnabled]);

  // Save on unmount / navigation / tab close (best-effort, fire-and-forget).
  useEffect(() => {
    if (!saveEnabled) return;
    const onUnload = () => save(videoId);
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [videoId, save, saveEnabled]);

  return {
    savedPosition,
    setPosition,
    setVideoDuration,
  };
}
