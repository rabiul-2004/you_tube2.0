import { useState, useRef } from "react";
import { Button } from "./ui/button";

const tabs = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "playlists", label: "Playlists" },
  { id: "community", label: "Community" },
  { id: "about", label: "About" },
];

const Channeltabs = () => {
  const [activeTab, setActiveTab] = useState("videos");
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b px-4 sm:px-6" ref={scrollRef}>
      <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`px-0 py-3 sm:py-4 border-b-2 rounded-none shrink-0 transition-all duration-200 text-sm ${
              activeTab === tab.id
                ? "border-black text-black font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Channeltabs;
