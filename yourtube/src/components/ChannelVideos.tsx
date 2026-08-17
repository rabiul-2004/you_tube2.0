import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import VideoCard from "./videocard";
import VideoEditDialog from "./VideoEditDialog";

export default function ChannelVideos({ videos, isOwner, onVideoUpdated }: any) {
  const [editingVideo, setEditingVideo] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <div className="text-5xl mb-4">📹</div>
        <p className="text-muted-foreground text-lg font-medium">
          {isOwner ? "No videos uploaded yet" : "No videos uploaded yet"}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {isOwner
            ? "Upload your first video to get started"
            : "This channel hasn't uploaded any videos yet"}
        </p>
      </div>
    );
  }

  const handleEdit = (video: any) => {
    setEditingVideo(video);
    setEditOpen(true);
  };

  const handleDelete = async (video: any) => {
    if (!window.confirm(`Delete "${video.videotitle}"? This can't be undone.`)) {
      return;
    }
    setDeletingId(video._id);
    try {
      await axiosInstance.delete(`/video/${video._id}`, {
        data: { uploader: video.uploader },
      });
      onVideoUpdated?.();
    } catch (error) {
      console.log(error);
      window.alert("Failed to delete video. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-up">
      <h2 className="text-xl font-semibold mb-4">Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video: any) => (
          <div key={video._id} className="relative group">
            <VideoCard video={video} />
            {isOwner && (
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEdit(video)}
                  disabled={deletingId === video._id}
                  className="p-2 bg-black/70 hover:bg-black text-white rounded-full"
                  aria-label="Edit video"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(video)}
                  disabled={deletingId === video._id}
                  className="p-2 bg-black/70 hover:bg-red-600 text-white rounded-full"
                  aria-label="Delete video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <VideoEditDialog
        video={editingVideo}
        isopen={editOpen}
        onclose={() => setEditOpen(false)}
        onSaved={onVideoUpdated}
      />
    </div>
  );
}
