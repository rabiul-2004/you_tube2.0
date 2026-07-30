import React, { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  return (
    <div className="w-full animate-fade-up">
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pattern-dots" />
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          <Avatar className="w-20 h-20 sm:w-32 sm:h-32 ring-4 ring-white -mt-10 sm:-mt-16">
            <AvatarFallback className="text-2xl sm:text-4xl">
              {channel?.channelname?.[0] || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold">
              {channel?.channelname || "Your Channel"}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>@{channel?.channelname?.toLowerCase().replace(/\s+/g, "") || "channel"}</span>
              <span>•</span>
              <span>1.2M subscribers</span>
              <span>•</span>
              <span>123 videos</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl line-clamp-2">
                {channel.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <Button
              onClick={() => setIsSubscribed(!isSubscribed)}
              variant={isSubscribed ? "outline" : "default"}
              className={`shrink-0 transition-all duration-200 ${
                isSubscribed
                  ? "bg-gray-100 hover:bg-gray-200 border-gray-300"
                  : "bg-black text-white hover:bg-black/90"
              }`}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
