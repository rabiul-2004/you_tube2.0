import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className={`space-y-3 animate-fade-up stagger-${Math.min(index + 1, 8)}`}>
      <div className="aspect-video rounded-xl bg-gray-200 animate-skeleton" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 animate-skeleton flex-shrink-0 hidden sm:block" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-skeleton w-full" />
          <div className="h-3 bg-gray-200 rounded animate-skeleton w-3/4" />
          <div className="h-3 bg-gray-200 rounded animate-skeleton w-1/2" />
        </div>
      </div>
    </div>
  );
}

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
      role="list"
      aria-label="Videos"
    >
      {videos.length > 0 ? (
        videos.map((video: any, i: number) => (
          <div
            key={video._id}
            className={`min-w-0 animate-fade-up stagger-${Math.min((i % 8) + 1, 8)}`}
            role="listitem"
          >
            <Videocard video={video} />
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-lg font-medium text-muted-foreground">No videos yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Upload a video to get started
          </p>
        </div>
      )}
    </div>
  );
};

export default Videogrid;
