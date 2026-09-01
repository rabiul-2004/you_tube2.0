"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Video, Copy, Link2, LogOut, Loader2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { VideoPlayerHandle } from "@/components/Videopplayer";
import { getSocket, closeSocket } from "@/lib/watchparty";
import type { Socket } from "socket.io-client";
import { useWatchParty } from "@/lib/useWatchParty";
import { useUser } from "@/lib/AuthContext";

interface WatchPartyDialogProps {
  videoId: string;
  playerRef: React.RefObject<VideoPlayerHandle | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string | null;
}

export default function WatchPartyDialog({
  videoId,
  playerRef,
  open,
  onOpenChange,
  initialCode,
}: WatchPartyDialogProps) {
  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const autoJoined = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSocket()
      .then((s) => {
        if (!cancelled) setSocket(s);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e?.message || "Could not connect to the watch party server");
          setConnectError(e?.message || "Could not connect to the watch party server");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const party = useWatchParty({ socket, videoId, playerRef });

  // Auto-join when arriving via an invite link (?party=<code>)
  useEffect(() => {
    if (!open || autoJoined.current || !socket) return;
    const code = initialCode?.trim();
    if (!code) return;
    autoJoined.current = true;
    party.joinRoom(code, (ok) => {
      if (ok) {
        toast.success("Joined watch party!");
      } else {
        toast.error(party.error || "Could not join room");
        onOpenChange(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, socket, initialCode]);

  const handleClose = () => {
    // Just dismiss the dialog. Stay in the room so playback sync continues.
    onOpenChange(false);
  };

  const handleLeave = () => {
    if (party.roomId) {
      party.leaveRoom();
    }
    onOpenChange(false);
  };

  const copyLink = () => {
    if (!party.roomUrl) return;
    navigator.clipboard
      ?.writeText(party.roomUrl)
      .then(() => toast.success("Invite link copied"))
      .catch(() => toast.error("Could not copy link"));
  };

  const myName = user?.name || "Guest";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" /> Watch Party
          </DialogTitle>
          <DialogDescription>
            {party.roomId
              ? "Watch together in real time. Invite friends and take control as host."
              : "Create a room and invite friends to watch this video together."}
          </DialogDescription>
        </DialogHeader>

        {connectError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {connectError}
          </div>
        )}

        {!party.roomId && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={() =>
                party.createRoom((ok, roomId) => {
                  if (ok) {
                    toast.success("Watch party created!");
                    if (navigator.clipboard && roomId) {
                      const url = `${window.location.origin}/watch/${videoId}?party=${roomId}`;
                      navigator.clipboard.writeText(url);
                    }
                  } else {
                    toast.error(party.error || "Failed to create room");
                  }
                })
              }
              disabled={party.connecting || !socket}
              className="w-full"
            >
              {party.connecting || !socket ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              Start a watch party
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or join with a code</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter party code (e.g. aB3xYz9)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <Button
                variant="secondary"
                onClick={() =>
                  party.joinRoom(joinCode, (ok) => {
                    if (ok) {
                      toast.success("Joined watch party!");
                    } else {
                      toast.error(party.error || "Could not join room");
                    }
                  })
                }
                disabled={!joinCode.trim() || party.connecting || !socket}
              >
                Join
              </Button>
            </div>
            {party.error && !party.roomId && (
              <p className="text-sm text-destructive">{party.error}</p>
            )}
          </div>
        )}

        {party.roomId && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Invite friends</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                    {party.roomUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={copyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(party.roomId || "")}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Participants ({party.members.length})
              </p>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {party.members.map((m) => (
                  <div key={m.socketId} className="flex items-center gap-2 text-sm">
                    <Avatar className="w-8 h-8">
                      {m.image ? <AvatarImage src={m.image} /> : null}
                      <AvatarFallback>{(m.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium flex-1 truncate">{m.name || "Guest"}</span>
                    {m.socketId === socket?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                    {m.isHost && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">host</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {party.isHost
                ? "You are the host. Your playback controls the room."
                : "Follow the host's playback."}
            </p>

            <Button variant="destructive" onClick={handleLeave} className="w-full">
              <LogOut className="w-4 h-4" /> Leave watch party
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          You're watching as <span className="font-medium">{myName}</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
