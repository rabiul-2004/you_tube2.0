"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import ChannelVideos from "./ChannelVideos";

export default function YourVideosContent() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  const loadVideos = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get(`/video/channel/${user._id}`);
      setVideos(res.data);
    } catch (error) {
      console.error("Error loading your videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadVideos();
    } else {
      setVideos([]);
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-12 animate-fade-up">
        <Clapperboard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Manage your uploads</h2>
        <p className="text-gray-600">
          Sign in to see videos you've uploaded.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-fade-up">
            <div className="w-40 aspect-video bg-gray-200 rounded-lg animate-skeleton" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded animate-skeleton w-2/3" />
              <div className="h-3 bg-gray-200 rounded animate-skeleton w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{videos.length} videos</p>
        {user?.channelname && (
          <Link href={`/channel/${user._id}`}>
            <Button variant="outline" size="sm">
              View channel
            </Button>
          </Link>
        )}
      </div>
      <ChannelVideos videos={videos} isOwner onVideoUpdated={loadVideos} />
    </div>
  );
}
