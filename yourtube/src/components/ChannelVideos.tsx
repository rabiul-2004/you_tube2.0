import VideoCard from "./videocard";

export default function ChannelVideos({ videos }: any) {
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <div className="text-5xl mb-4">📹</div>
        <p className="text-gray-600 text-lg font-medium">No videos uploaded yet</p>
        <p className="text-sm text-gray-500 mt-1">Upload your first video to get started</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h2 className="text-xl font-semibold mb-4">Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video: any) => (
          <VideoCard key={video._id} video={video} />
        ))}
      </div>
    </div>
  );
}
