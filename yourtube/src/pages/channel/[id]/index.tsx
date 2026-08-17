import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import Channeldialogue from "@/components/channeldialogue";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchChannel = useCallback(async () => {
    if (!id) return;
    try {
      const [ch, vids] = await Promise.all([
        axiosInstance.get(`/user/${id}`),
        axiosInstance.get(`/video/channel/${id}`),
      ]);
      setChannel(ch.data);
      setVideos(vids.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchChannel();
  }, [id, fetchChannel]);

  const isOwner = user && channel && user._id === channel._id;

  return (
    <div className="flex-1 min-h-screen bg-background animate-fade-in">
      <div className="max-w-full mx-auto">
        {loading ? (
          <div className="animate-pulse p-6">
            <div className="h-48 md:h-64 bg-gray-200 rounded-lg" />
            <div className="flex items-center gap-4 p-6">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gray-200" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-4 w-64 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ) : channel ? (
          <>
            <ChannelHeader
              channel={channel}
              videoCount={videos.length}
              onEditChannel={() => setEditOpen(true)}
            />
            <Channeltabs />
            <div className="px-4 sm:px-6 pb-8 space-y-8">
              {isOwner && (
                <VideoUploader channelId={id} channelName={channel?.channelname} />
              )}
              <ChannelVideos
                videos={videos}
                isOwner={isOwner}
                onVideoUpdated={fetchChannel}
              />
            </div>
            {isOwner && (
              <Channeldialogue
                isopen={editOpen}
                onclose={() => setEditOpen(false)}
                mode="edit"
                channeldata={channel}
                onSuccess={fetchChannel}
              />
            )}
          </>
        ) : (
          <div className="text-center py-16 animate-fade-up">
            <p className="text-gray-600 text-lg font-medium">Channel not found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPage;
