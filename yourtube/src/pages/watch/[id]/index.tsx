import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

function WatchSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-gray-200 rounded-xl animate-skeleton" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-skeleton w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-skeleton w-1/2" />
            <div className="h-20 bg-gray-200 rounded animate-skeleton" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-40 aspect-video bg-gray-200 rounded-lg animate-skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-skeleton" />
                <div className="h-3 bg-gray-200 rounded animate-skeleton w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [videos, setvideo] = useState<any>(null);
  const [video, setvide] = useState<any>(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get("/video/getall");
        const video = res.data?.filter((vid: any) => vid._id === id);
        setvideo(video?.[0]);
        setvide(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, [id]);

  if (loading) return <WatchSkeleton />;

  if (!videos) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="text-center py-16 animate-fade-up">
          <div className="text-6xl mb-4">🎥</div>
          <h2 className="text-xl font-semibold text-gray-600">Video not found</h2>
          <p className="text-sm text-gray-500 mt-1">This video may have been removed or is unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Videopplayer video={videos} />
            <VideoInfo video={videos} />
            <Comments videoId={id} />
          </div>
          <div className="space-y-4">
            <RelatedVideos videos={video || []} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;
