"use client";

import {
  Video as VideoIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WatchPartyVideoTile from "./WatchPartyVideoTile";
import WatchPartyCallControls from "./WatchPartyCallControls";
import type { WatchPartyCallApi } from "@/lib/useWatchPartyCall";
import type { PartyMember } from "@/lib/WatchPartyProvider";

export default function WatchPartyCall({
  call,
  members,
  myName,
}: {
  call: WatchPartyCallApi;
  members: PartyMember[];
  myName: string;
}) {
  const remoteTiles = Object.entries(call.remoteStreams);

  if (!call.inCall) {
    return (
      <div className="flex flex-col gap-3 items-center py-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <VideoIcon className="w-4 h-4" /> Join the live session
        </div>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Camera, microphone and screen share need the watch party page served over
          <span className="font-medium"> HTTPS or localhost</span>.
        </p>
        <Button onClick={() => call.joinCall()} disabled={call.joining} className="w-full max-w-[220px]">
          {call.joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
          Join with camera & mic
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-0.5">
        <WatchPartyVideoTile stream={call.localStream} name={`${myName} (you)`} muted mirrored />
        {remoteTiles.map(([id, stream]) => {
          const member = members.find((m) => m.socketId === id);
          return (
            <WatchPartyVideoTile key={id} stream={stream} name={member?.name || "Guest"} muted={false} />
          );
        })}
        {remoteTiles.length === 0 && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            Waiting for others to join...
          </div>
        )}
      </div>

      <WatchPartyCallControls call={call} />
    </div>
  );
}