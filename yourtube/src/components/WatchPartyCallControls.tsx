"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WatchPartyCallApi } from "@/lib/useWatchPartyCall";

export default function WatchPartyCallControls({
  call,
  showLeaveLabel = true,
}: {
  call: WatchPartyCallApi;
  showLeaveLabel?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant={call.micOn ? "secondary" : "destructive"}
        size="icon"
        onClick={call.toggleMic}
        aria-label={call.micOn ? "Mute microphone" : "Unmute microphone"}
      >
        {call.micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
      </Button>
      <Button
        variant={call.camOn ? "secondary" : "destructive"}
        size="icon"
        onClick={call.toggleCam}
        disabled={call.sharing}
        aria-label={call.camOn ? "Turn camera off" : "Turn camera on"}
      >
        {call.camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
      </Button>
      <Button
        variant={call.sharing ? "secondary" : "outline"}
        size="icon"
        onClick={call.toggleShare}
        aria-label={call.sharing ? "Stop sharing screen" : "Share screen"}
      >
        {call.sharing ? <ScreenShareOff className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
      </Button>
      {showLeaveLabel ? (
        <Button variant="destructive" onClick={call.leaveCall} aria-label="Leave call">
          <PhoneOff className="w-4 h-4" /> Leave call
        </Button>
      ) : (
        <Button variant="destructive" size="icon" onClick={call.leaveCall} aria-label="Leave call">
          <PhoneOff className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}