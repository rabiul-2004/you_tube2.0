import React from "react";
import { Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import { useSubscribe } from "@/lib/useSubscribe";
import { formatCount } from "@/lib/formatCount";

const ChannelHeader = ({ channel, videoCount, onEditChannel }: any) => {
  const { user } = useUser();
  const isOwner = user && channel && user._id === channel._id;
  const { subscribed, count, loading, toggle } = useSubscribe(channel?._id);

  return (
    <div className="w-full animate-fade-up">
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pattern-dots" />
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          <Avatar className="w-20 h-20 sm:w-32 sm:h-32 ring-4 ring-white -mt-10 sm:-mt-16">
            {channel?.image ? (
              <AvatarImage src={channel.image} alt={channel.channelname} />
            ) : null}
            <AvatarFallback className="text-2xl sm:text-4xl">
              {channel?.channelname?.[0] || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold">
              {channel?.channelname || "Your Channel"}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>@{channel?.channelname?.toLowerCase().replace(/\s+/g, "") || "channel"}</span>
              <span>•</span>
              <span>{formatCount(count)} subscribers</span>
              <span>•</span>
              <span>{videoCount || 0} videos</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-foreground/70 max-w-2xl line-clamp-2">
                {channel.description}
              </p>
            )}
          </div>

          {user && isOwner ? (
            <Button
              variant="outline"
              className="shrink-0 transition-all duration-200 bg-background border-border hover:bg-accent"
              onClick={onEditChannel}
            >
              <Settings className="w-4 h-4 mr-1.5" />
              Edit channel
            </Button>
          ) : (
            user && (
              <Button
                onClick={toggle}
                disabled={loading}
                variant={subscribed ? "outline" : "default"}
                className={`shrink-0 transition-all duration-200 ${
                  subscribed
                    ? "bg-accent hover:bg-accent border-border"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                {loading ? "..." : subscribed ? "Subscribed" : "Subscribe"}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
