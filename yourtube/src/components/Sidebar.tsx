"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Clock, ThumbsUp, PlaySquare, Clock4, Library, Crown, Download, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import WatchPartyJoinDialog from "./WatchPartyJoinDialog";

const menuItems = [
  { icon: Home, label: "Home", href: "/" },
];

const youItems = [
  { icon: Library, label: "Library", href: "/library" },
  { icon: Clock, label: "History", href: "/history" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked" },
  { icon: Clock4, label: "Watch later", href: "/watch-later" },
  { icon: Download, label: "Downloads", href: "/downloads" },
  { icon: PlaySquare, label: "Your videos", href: "/your-videos" },
];

const Sidebar = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [joinOpen, setJoinOpen] = useState(false);

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
                ? "bg-accent font-medium"
                : "hover:bg-accent"
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
            className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent touch-target"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
        <Link
          href="/plans"
          onClick={onClose}
          className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent touch-target"
        >
          <Crown className="w-5 h-5 flex-shrink-0 text-amber-500" />
          <span className="text-sm font-medium">Upgrade / Plans</span>
        </Link>
      </div>

      <div className="border-t mx-2 my-2" />

      <div className="p-2">
        <div className="flex items-center gap-5 px-3 py-2.5 text-sm font-medium">
          <span>Watch together</span>
        </div>
        <button
          onClick={() => {
            setJoinOpen(true);
            onClose();
          }}
          className="flex items-center gap-5 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent w-full touch-target"
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">Join a watch party</span>
        </button>
      </div>

      <div className="border-t mx-2 my-2" />

      <div className="p-4 text-xs text-muted-foreground space-y-1">
        <p>About Press Copyright</p>
        <p>Contact us Creators Advertise</p>
        <p>Developers</p>
        <p className="pt-2">© 2026 YourTube Clone</p>
      </div>
    </div>
  );

  return (
    <>
      <WatchPartyJoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:block w-60 flex-shrink-0 border-r bg-sidebar h-[calc(100vh-57px)] sticky top-[57px] overflow-hidden transition-all duration-300",
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
            className="relative w-72 h-full bg-sidebar shadow-xl animate-slide-left overflow-hidden safe-area-top safe-area-bottom"
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