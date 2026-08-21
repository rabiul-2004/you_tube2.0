import DownloadsContent from "@/components/DownloadsContent";

export default function DownloadsPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-6xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Downloads</h1>
        <DownloadsContent />
      </div>
    </main>
  );
}
