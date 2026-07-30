"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { BASE_URL } from "@/lib/axiosinstance";
import { useState } from "react";

export default function VideoCard({ video }: any) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <Link href={`/watch/${video?._id}`} className="group block animate-fade-up">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
          {!error ? (
            <video
              src={`${BASE_URL}/${video?.filepath}`}
              className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              onLoadedData={() => setLoaded(true)}
              onError={() => setError(true)}
              muted
              preload="metadata"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
              Video unavailable
            </div>
          )}
          {!loaded && !error && (
            <div className="absolute inset-0 animate-skeleton" />
          )}
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] px-1 rounded font-medium">
            10:24
          </div>
        </div>
        <div className="flex gap-3 px-1">
          <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5">
            <AvatarFallback className="text-sm">{video?.videochanel?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 leading-5 group-hover:text-blue-600 transition-colors duration-200">
              {video?.videotitle}
            </h3>
            <p className="text-xs text-gray-600 mt-1.5 hover:text-gray-900 transition-colors">
              {video?.videochanel}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {video?.views?.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video?.createdAt))} ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
