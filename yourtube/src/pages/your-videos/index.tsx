import YourVideosContent from "@/components/YourVideosContent";

export default function YourVideosPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-6xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Your videos</h1>
        <YourVideosContent />
      </div>
    </main>
  );
}
