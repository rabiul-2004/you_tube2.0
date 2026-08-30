import { Bell, Crown, Menu, Mic, Search, Sun, Moon, User, VideoIcon, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import ProfileEditDialog from "./ProfileEditDialog";
import SignInDialog from "./SignInDialog";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import { hasActivePaidPlan } from "@/lib/planUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosinstance";

const Header = ({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) => {
  const { user, logout, emailVerified, sendverificationemail, applyTheme } = useUser();
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const [issigninopen, setissigninopen] = useState(false);
  const [isprofileopen, setisprofileopen] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    setCurrentTheme(root.classList.contains("dark") ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // dismiss the user menu on any scroll — prevents stale/off-screen dropdowns
  // and accidental item taps when the page moves under an open menu
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [userMenuOpen]);

  const handleThemeToggle = async () => {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(newTheme);
    applyTheme(newTheme);

    if (user?._id) {
      try {
        await axiosInstance.put(`/user/theme/${user._id}`, { theme: newTheme });
      } catch (err) {
        console.error("Failed to save theme:", err);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b safe-area-top">
      {isSearchOpen && (
        <div className="sm:hidden flex items-center gap-2 px-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(false)}
            className="shrink-0 h-9 w-9 flex-shrink-0"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </Button>
          <form onSubmit={handleSearch} className="flex flex-1 min-w-0">
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-l-full border-r-0 focus-visible:ring-0 text-sm h-9 min-w-0"
              autoComplete="off"
              aria-label="Search videos"
            />
            <Button
              type="submit"
              className="rounded-r-full bg-secondary hover:bg-accent text-muted-foreground border border-l-0 h-9 px-4 flex-shrink-0"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between px-3 sm:px-4 py-2 h-14",
          isSearchOpen && "hidden sm:flex"
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 touch-target"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Link href="/" className="flex items-center gap-1 shrink-0" aria-label="YourTube Home">
            <div className="bg-red-600 p-1.5 sm:p-2 rounded">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <span className="text-lg font-medium hidden sm:inline">YourTube</span>
            <span className="text-[10px] text-muted-foreground ml-0.5 hidden sm:inline">IN</span>
          </Link>
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center flex-1 max-w-2xl mx-4"
        >
          <div className="flex flex-1">
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-l-full border-r-0 focus-visible:ring-0 text-sm h-9 min-w-0"
              autoComplete="off"
              aria-label="Search videos"
            />
            <Button
              type="submit"
              className="rounded-r-full bg-secondary hover:bg-accent text-muted-foreground border border-l-0 h-9 px-4 sm:px-6 flex-shrink-0"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full ml-2 shrink-0 h-9 w-9 touch-target"
            aria-label="Voice search"
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isSearchOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="shrink-0 h-9 w-9 touch-target sm:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 touch-target"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            {mounted && currentTheme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-9 w-9 touch-target"
                aria-label="Create video"
              >
                <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-9 w-9 touch-target"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <DropdownMenu
                modal={false}
                open={userMenuOpen}
                onOpenChange={setUserMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 touch-target"
                    aria-label="User menu"
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src={user.image} alt="" />
                      <AvatarFallback className="text-xs sm:text-sm">{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-between px-2 py-2 border-b">
                    <span className="text-xs text-muted-foreground">Plan</span>
                    <Link
                      href="/plans"
                      className="flex items-center gap-1 text-sm font-medium touch-target py-1 px-2 rounded-lg hover:bg-accent"
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      {hasActivePaidPlan(user) ? user.plan : "Upgrade"}
                    </Link>
                  </div>
                  {user?.channelname ? (
                    <DropdownMenuItem asChild>
                      <Link href={`/channel/${user?._id}`} className="touch-target py-2">Your channel</Link>
                    </DropdownMenuItem>
                  ) : (
                    <div className="px-2 py-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full touch-target"
                        onClick={() => setisdialogeopen(true)}
                      >
                        Create Channel
                      </Button>
                    </div>
                  )}
                  <DropdownMenuItem
                    onClick={() => setisprofileopen(true)}
                    className="touch-target py-2"
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="touch-target py-2">History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/liked" className="touch-target py-2">Liked videos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/watch-later" className="touch-target py-2">Watch later</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="touch-target py-2">Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              className="flex items-center gap-2 text-sm h-9 px-3 touch-target"
              onClick={() => setissigninopen(true)}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
        </div>
      </div>

      {user && !emailVerified && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border-t text-sm text-amber-800">
          <span className="truncate">
            Verify your email to upload videos and comment.
          </span>
          <button
            onClick={async () => {
              setResendingVerification(true);
              try {
                await sendverificationemail();
                toast.success("Verification link sent. Check your inbox.");
              } catch (error: any) {
                console.error("Resend verification email failed:", error);
                if (error?.code === "auth/too-many-requests") {
                  toast.error(
                    "Too many emails sent recently. Please wait a few minutes and try again."
                  );
                } else {
                  toast.error("Could not send the email. Try again.");
                }
              } finally {
                setResendingVerification(false);
              }
            }}
            disabled={resendingVerification}
            className="shrink-0 font-medium underline hover:text-amber-950"
          >
            {resendingVerification ? "Sending..." : "Resend email"}
          </button>
        </div>
      )}
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
      <ProfileEditDialog
        isopen={isprofileopen}
        onclose={() => setisprofileopen(false)}
      />
      <SignInDialog isopen={issigninopen} onclose={() => setissigninopen(false)} />
    </header>
  );
};

export default Header;
