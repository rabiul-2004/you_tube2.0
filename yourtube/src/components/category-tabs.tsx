"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  "All", "Music", "Gaming", "Movies", "News",
  "Sports", "Technology", "Comedy", "Education",
  "Science", "Travel", "Food", "Fashion",
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  const checkScrollShadows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftShadow(scrollLeft > 10);
      setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -120, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 120, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScrollShadows();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScrollShadows, { passive: true });
    window.addEventListener("resize", checkScrollShadows);
    return () => {
      el?.removeEventListener("scroll", checkScrollShadows);
      window.removeEventListener("resize", checkScrollShadows);
    };
  }, []);

  return (
    <div className="relative">
      {showLeftShadow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white to-transparent flex items-center justify-center z-10 touch-target -ml-2 md:hidden"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide py-1 px-2"
        onScroll={checkScrollShadows}
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
            aria-pressed={activeCategory === category}
          >
            {category}
          </Button>
        ))}
      </div>
      {showRightShadow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent flex items-center justify-center z-10 touch-target -mr-2 md:hidden"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
}
