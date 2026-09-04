"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users, PhoneOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import WatchPartyVideoTile from "./WatchPartyVideoTile";
import WatchPartyCallControls from "./WatchPartyCallControls";
import { useWatchParty } from "@/lib/WatchPartyProvider";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";

export default function WatchPartyDock({ onOpenDialog }: { onOpenDialog: () => void }) {
  const party = useWatchParty();
  const { user } = useUser();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  if (!party.call.inCall || !party.state.roomId) return null;

  const remoteTiles = Object.entries(party.call.remoteStreams);
  const inCallCount = party.state.members.filter((m) => m.inCall).length;
  const myName = user?.name || "You";

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg overflow-hidden">
      <div className="flex items-center gap-1.5 p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-1.5 text-xs font-medium h-auto py-1.5"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Live · {inCallCount} on call
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-foreground" onClick={() => router.push(`/party?room=${party.state.roomId ?? ""}`)} aria-label="Open full-screen view">
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpenDialog} aria-label="Open watch party">
          <Users className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={party.call.leaveCall} aria-label="Leave call">
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2 p-2">
          <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto">
            <WatchPartyVideoTile stream={party.call.localStream} name={`${myName} (you)`} muted mirrored />
            {remoteTiles.map(([id, stream]) => {
              const member = party.state.members.find((m) => m.socketId === id);
              return (
                <WatchPartyVideoTile key={id} stream={stream} name={member?.name || "Guest"} muted={false} />
              );
            })}
            {remoteTiles.length === 0 && (
              <div className="flex items-center justify-center text-[10px] text-muted-foreground">
                Waiting for others...
              </div>
            )}
          </div>
          <WatchPartyCallControls call={party.call} showLeaveLabel={false} isHost={party.state.isHost} />
        </div>
      )}
    </div>
  );
}