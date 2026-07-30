import WatchLaterContent from "@/components/WatchLaterContent";

export default function WatchLaterPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-4xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Watch later</h1>
        <WatchLaterContent />
      </div>
    </main>
  );
}
