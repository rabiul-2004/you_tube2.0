import LibraryContent from "@/components/LibraryContent";

export default function LibraryPage() {
  return (
    <main className="flex-1 p-4 sm:p-6 animate-fade-in">
      <div className="max-w-6xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Library</h1>
        <LibraryContent />
      </div>
    </main>
  );
}
