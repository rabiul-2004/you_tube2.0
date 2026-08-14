"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Compass, Clock, ThumbsUp, PlaySquare, Clock4, Library, ChevronDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Explore", href: "/" },
  { icon: PlaySquare, label: "Shorts", href: "/" },
];

const youItems = [
  { icon: Library, label: "Library", href: "/" },
  { icon: Clock, label: "History", href: "/history" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked" },
  { icon: Clock4, label: "Watch later", href: "/watch-later" },
];

const Sidebar = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const content = (
    <div className="h-full overflow-y-auto scrollbar-hide safe-area-bottom pb-8">
      <div className="p-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 group touch-target",
              router.pathname === item.href
                ? "bg-gray-100 font-medium"
                : "hover:bg-gray-100"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="border-t mx-2 my-2" />

      <div className="p-2">
        <div className="flex items-center gap-5 px-3 py-2.5 text-sm font-medium">
          <span>You</span>
        </div>
        {youItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 touch-target"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
        <Link
          href="/plans"
          onClick={onClose}
          className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 touch-target"
        >
          <Crown className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span className="text-sm font-medium">Upgrade / Plans</span>
        </Link>
        {showMore && (
          <div className="animate-fade-up">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 touch-target"
            >
              <PlaySquare className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Your videos</span>
            </Link>
          </div>
        )}
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 w-full touch-target"
        >
          <ChevronDown
            className={cn(
              "w-5 h-5 flex-shrink-0 transition-transform duration-200",
              showMore && "rotate-180"
            )}
          />
          <span className="text-sm">{showMore ? "Show less" : "Show more"}</span>
        </button>
      </div>

      <div className="border-t mx-2 my-2" />

      <div className="p-2">
        <div className="flex items-center gap-5 px-3 py-2.5 text-sm font-medium">
          <span>Explore</span>
        </div>
        {["Trending", "Music", "Gaming", "News", "Sports", "Education"].map(
          (item) => (
            <Link
              key={item}
              href="/"
              onClick={onClose}
              className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 touch-target"
            >
              <span className="text-sm">{item}</span>
            </Link>
          )
        )}
      </div>

      <div className="p-4 text-xs text-gray-500 space-y-1">
        <p>About Press Copyright</p>
        <p>Contact us Creators Advertise</p>
        <p>Developers</p>
        <p className="pt-2">© 2026 YourTube Clone</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:block w-60 flex-shrink-0 border-r bg-white h-[calc(100vh-57px)] sticky top-[57px] overflow-hidden transition-all duration-300",
          !isOpen && "md:hidden"
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 animate-fade-in" />
          <aside
            className="relative w-72 h-full bg-white shadow-xl animate-slide-left overflow-hidden safe-area-top safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
