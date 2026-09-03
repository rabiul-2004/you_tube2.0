"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Users, Video, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import WatchPartyVideoTile from "@/components/WatchPartyVideoTile";
import WatchPartyCallControls from "@/components/WatchPartyCallControls";
import PartyChatPanel from "@/components/PartyChatPanel";
import { useWatchParty } from "@/lib/WatchPartyProvider";
import { useUser } from "@/lib/AuthContext";

export default function PartyPage() {
  const party = useWatchParty();
  const { user } = useUser();
  const router = useRouter();
  const wasInCall = useRef(false);
  const [chatOpen, setChatOpen] = useState(false);

  const backLink = party.state.videoId
    ? `/watch/${party.state.videoId}?party=${party.state.roomId ?? ""}`
    : "/";

  // When the call ends (red button) while on the immersive view, get out of
  // the full-screen view and return to the watch page.
  useEffect(() => {
    if (party.call.inCall) {
      wasInCall.current = true;
      return;
    }
    if (wasInCall.current) {
      router.replace(backLink);
    }
  }, [party.call.inCall, backLink, router]);

  const remoteTiles = Object.entries(party.call.remoteStreams);
  const inCallCount = party.state.members.filter((m) => m.inCall).length;
  const myName = user?.name || "You";

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col p-3 gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={backLink}>
              <ArrowLeft className="w-4 h-4" /> Back to watch
            </Link>
          </Button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Live · {inCallCount} on call
          </span>
        </div>
      </div>

      {party.call.inCall ? (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr gap-2 overflow-y-auto content-start">
            <WatchPartyVideoTile stream={party.call.localStream} name={`${myName} (you)`} muted mirrored />
            {remoteTiles.map(([id, stream]) => {
              const member = party.state.members.find((m) => m.socketId === id);
              return (
                <WatchPartyVideoTile key={id} stream={stream} name={member?.name || "Guest"} muted={false} />
              );
            })}
            {remoteTiles.length === 0 && (
              <div className="flex items-center justify-center text-sm text-muted-foreground col-span-full">
                Waiting for others to join the call...
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-center gap-2">
            <WatchPartyCallControls call={party.call} showLeaveLabel={false} />
            <Button
              variant={chatOpen ? "secondary" : "outline"}
              size="icon"
              onClick={() => setChatOpen((o) => !o)}
              aria-label="Open chat"
              className="relative"
            >
              <MessageSquare className="w-4 h-4" />
              {party.state.chat.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {party.state.chat.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Video className="w-5 h-5" /> You are not on the call yet
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Join with your camera, microphone or screen share to see yourself and others in full view.
          </p>
          <Button onClick={() => party.call.joinCall()} disabled={party.call.joining} className="max-w-[260px] w-full">
            {party.call.joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            Join with camera & mic
          </Button>
          <Button variant="outline" onClick={() => setChatOpen(true)}>
            <MessageSquare className="w-4 h-4" /> Open chat
          </Button>
        </div>
      )}

      <PartyChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
