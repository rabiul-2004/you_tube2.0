"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  PhoneOff,
  Circle,
  Square,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WatchPartyCallApi } from "@/lib/useWatchPartyCall";
import { useEffect, useState } from "react";

export default function WatchPartyCallControls({
  call,
  showLeaveLabel = true,
  isHost = false,
}: {
  call: WatchPartyCallApi;
  showLeaveLabel?: boolean;
  isHost?: boolean;
}) {
  // getDisplayMedia is not supported on mobile browsers — hide screen share there.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getDisplayMedia
    );
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {isHost && (
        <>
          {call.recordingURL && !call.recording && (
            <Button
              variant="outline"
              size="icon"
              title="Download recording"
              onClick={() => {
                const url = call.recordingURL;
                if (!url) return;
                const a = document.createElement("a");
                a.href = url;
                a.download = `watch-party-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
              aria-label="Download recording"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant={call.recording ? "destructive" : "secondary"}
            size="icon"
            onClick={call.recording ? call.stopRecording : call.startRecording}
            aria-label={call.recording ? "Stop recording" : "Start recording"}
          >
            {call.recording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Circle className="w-4 h-4 fill-current" />
            )}
          </Button>
        </>
      )}
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
      {canShare && (
        <Button
          variant={call.sharing ? "secondary" : "outline"}
          size="icon"
          onClick={call.toggleShare}
          aria-label={call.sharing ? "Stop sharing screen" : "Share screen"}
        >
          {call.sharing ? <ScreenShareOff className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
        </Button>
      )}
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