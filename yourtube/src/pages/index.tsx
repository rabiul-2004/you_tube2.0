import CategoryTabs from "@/components/category-tabs";
import Videogrid from "@/components/Videogrid";

export default function Home() {
  return (
    <main className="flex-1 animate-fade-in safe-area-bottom pb-8">
      <div className="max-w-full px-2 sm:px-4 lg:px-6 mx-auto">
        <CategoryTabs />
        <Videogrid />
      </div>
    </main>
  );
}
