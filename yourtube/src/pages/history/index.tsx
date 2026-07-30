import HistoryContent from "@/components/HistoryContent";

export default function HistoryPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-4xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Watch history</h1>
        <HistoryContent />
      </div>
    </main>
  );
}
