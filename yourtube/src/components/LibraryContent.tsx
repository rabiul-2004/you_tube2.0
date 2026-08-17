"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Clock4,
  ThumbsUp,
  Clapperboard,
  PlaySquare,
  Library,
} from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

export default function LibraryContent() {
  const { user } = useUser();
  const [counts, setCounts] = useState({
    history: 0,
    watchlater: 0,
    liked: 0,
    videos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCounts({ history: 0, watchlater: 0, liked: 0, videos: 0 });
      setLoading(false);
      return;
    }
    let mounted = true;
    const loadCounts = async () => {
      try {
        const [h, w, l, v] = await Promise.all([
          axiosInstance.get(`/history/${user._id}`),
          axiosInstance.get(`/watch/${user._id}`),
          axiosInstance.get(`/like/${user._id}`),
          axiosInstance.get(`/video/channel/${user._id}`),
        ]);
        if (!mounted) return;
        setCounts({
          history: h.data.length,
          watchlater: w.data.length,
          liked: l.data.length,
          videos: v.data.length,
        });
      } catch (error) {
        console.error("Error loading library:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCounts();
    return () => {
      mounted = false;
    };
  }, [user?._id]);

  const items: any[] = [
    { href: "/history", icon: Clock, label: "History", count: counts.history },
    {
      href: "/watch-later",
      icon: Clock4,
      label: "Watch later",
      count: counts.watchlater,
    },
    {
      href: "/liked",
      icon: ThumbsUp,
      label: "Liked videos",
      count: counts.liked,
    },
    {
      href: "/your-videos",
      icon: Clapperboard,
      label: "Your videos",
      count: counts.videos,
    },
  ];

  if (user?.channelname) {
    items.push({
      href: `/channel/${user._id}`,
      icon: PlaySquare,
      label: "Your channel",
      count: null,
    });
  }

  if (!user) {
    return (
      <div className="text-center py-12 animate-fade-up">
        <Library className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your library</h2>
        <p className="text-gray-600">
          Sign in to see your history, liked videos, watch later and uploads.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-all duration-200 animate-fade-up"
        >
          <div className="bg-gray-100 group-hover:bg-gray-200 rounded-full p-3">
            <item.icon className="w-6 h-6 text-gray-700" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm group-hover:text-blue-600 transition-colors">
              {item.label}
            </h3>
            <p className="text-xs text-gray-600">
              {loading ? "..." : item.count === null ? "Open channel" : `${item.count} ${item.count === 1 ? "item" : "items"}`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
