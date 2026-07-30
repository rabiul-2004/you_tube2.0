import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  "All", "Music", "Gaming", "Movies", "News",
  "Sports", "Technology", "Comedy", "Education",
  "Science", "Travel", "Food", "Fashion",
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide py-1"
    >
      {categories.map((category) => (
        <Button
          key={category}
          ref={category === activeCategory ? activeRef : undefined}
          variant={activeCategory === category ? "default" : "secondary"}
          className={cn(
            "whitespace-nowrap shrink-0 transition-all duration-200 text-sm",
            activeCategory === category
              ? "bg-black text-white hover:bg-black/90"
              : "bg-gray-100 hover:bg-gray-200 text-black"
          )}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
