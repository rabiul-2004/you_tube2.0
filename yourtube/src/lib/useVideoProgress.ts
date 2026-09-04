"use client";

import { useEffect, useState } from "react";
import axiosInstance from "./axiosinstance";
import { useUser } from "./AuthContext";

// Module-level cache so a video's saved position is fetched once and shared
// across every card that renders it (home, search, history, library, ...).
const cache = new Map<string, { position: number | null; loaded: boolean }>();
const inFlight = new Map<string, Promise<void>>();

/**
 * Returns the signed-in user's saved watch position for a video, so a red
 * "watched so far" progress bar can be drawn over the thumbnail. Reads
 * through a shared cache to avoid N duplicate requests on a page.
 */
export function useVideoProgress(videoId: string | undefined) {
  const { user } = useUser();
  const initialKey = user?._id && videoId ? `${user._id}:${videoId}` : null;
  const [state, setState] = useState<{ position: number | null; loaded: boolean }>(
    initialKey ? cache.get(initialKey) ?? { position: null, loaded: false } : { position: null, loaded: false }
  );

  useEffect(() => {
    if (!videoId || !user?._id) return;
    const key = `${user._id}:${videoId}`;

    if (cache.has(key)) {
      setState(cache.get(key)!);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/progress/${videoId}`);
        const pos = res.data?.progress?.position;
        const value = {
          position: typeof pos === "number" && pos > 3 ? pos : null,
          loaded: true,
        };
        cache.set(key, value);
        if (!cancelled) setState(value);
      } catch {
        const value = { position: null, loaded: true };
        cache.set(key, value);
        if (!cancelled) setState(value);
      }
    };

    const existing = inFlight.get(key);
    if (existing) {
      existing
        .then(() => {
          if (!cancelled) setState(cache.get(key) ?? { position: null, loaded: true });
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    const promise = load();
    inFlight.set(key, promise);
    promise.finally(() => {
      inFlight.delete(key);
    });

    return () => {
      cancelled = true;
    };
  }, [videoId, user?._id]);

  return state;
}
