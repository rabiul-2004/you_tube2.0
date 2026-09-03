"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Video, Copy, Link2, LogOut, Loader2, MessageSquare, Send, PhoneCall, Mic, MicOff, VideoOff, Maximize2 } from "lucide-react";
import { useRouter } from "next/router";
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
import { useWatchParty } from "@/lib/WatchPartyProvider";
import { useUser } from "@/lib/AuthContext";
import { formatChatTime } from "@/lib/videoUtils";
import WatchPartyCall from "./WatchPartyCall";

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
  const party = useWatchParty();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [chatText, setChatText] = useState("");
  const [tab, setTab] = useState<"people" | "chat" | "live">("people");
  const autoJoined = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to the newest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [party.state.chat]);

  const handleSend = () => {
    const text = chatText.trim();
    if (!text) return;
    party.sendChat(text);
    setChatText("");
  };

  // Expose the current video's player to the session-wide provider
  useEffect(() => {
    party.registerPlayer(playerRef);
    return () => party.registerPlayer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerRef]);

  // Auto-join when arriving via an invite link (?party=<code>)
  useEffect(() => {
    if (!open || autoJoined.current) return;
    const code = initialCode?.trim();
    if (!code) return;
    autoJoined.current = true;
    party.joinRoom(code, (ok) => {
      if (ok) {
        toast.success("Joined watch party!");
      } else {
        toast.error(party.state.error || "Could not join room");
        onOpenChange(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCode]);

  const handleClose = () => {
    // Just dismiss the dialog. Stay in the room so playback sync continues.
    onOpenChange(false);
  };

  const handleLeave = () => {
    if (party.state.roomId) {
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
            {party.state.roomId
              ? "Watch together in real time. Invite friends and take control as host."
              : "Create a room and invite friends to watch together."}
          </DialogDescription>
        </DialogHeader>

        {connectError && (
          <ErrorBanner>{connectError}</ErrorBanner>
        )}
        {!connectError && party.state.error && !party.state.roomId && (
          <ErrorBanner>{party.state.error}</ErrorBanner>
        )}

        {!party.state.roomId && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={() =>
                party.createRoom(videoId, (ok, roomId) => {
                  if (ok) {
                    toast.success("Watch party created!");
                    if (navigator.clipboard && roomId) {
                      const url = `${window.location.origin}/watch/${videoId}?party=${roomId}`;
                      navigator.clipboard.writeText(url);
                    }
                  } else {
                    toast.error(party.state.error || "Failed to create room");
                  }
                })
              }
              disabled={party.state.connecting}
              className="w-full"
            >
              {party.state.connecting ? (
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
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() =>
                  party.joinRoom(joinCode, (ok) => {
                    if (ok) {
                      toast.success("Joined watch party!");
                    } else {
                      toast.error(party.state.error || "Could not join room");
                    }
                  })
                }
                disabled={!joinCode.trim() || party.state.connecting}
              >
                Join
              </Button>
            </div>
          </div>
        )}

        {party.state.roomId && (
          <div className="flex flex-col gap-3">
            <div className="flex rounded-lg border bg-muted/40 p-0.5">
              {(
                [
                  { key: "people", label: "People", icon: Users, badge: 0 },
                  { key: "live", label: "Live", icon: PhoneCall, badge: party.state.members.filter((m) => m.inCall).length },
                  { key: "chat", label: "Chat", icon: MessageSquare, badge: party.state.chat.length },
                ] as const
              ).map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                  {badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary/15 text-primary text-[11px]">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === "people" && (
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
                      <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(party.state.roomId || "")}>
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Participants ({party.state.members.length})
                  </p>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {party.state.members.map((m) => (
                      <div key={m.socketId} className="flex items-center gap-2 text-sm">
                        <Avatar className="w-8 h-8">
                          {m.image ? <AvatarImage src={m.image} /> : null}
                          <AvatarFallback>{(m.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium flex-1 truncate">{m.name || "Guest"}</span>
                        {party.myId === m.socketId && (
                          <span className="text-[10px] text-muted-foreground/70">(you)</span>
                        )}
                        {m.inCall && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            {m.micOn ? (
                              <Mic className="w-3.5 h-3.5" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5" />
                            )}
                            {m.camOn ? (
                              <Video className="w-3.5 h-3.5" />
                            ) : (
                              <VideoOff className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                        {m.isHost && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">host</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {party.state.isHost
                    ? "You are the host. Your playback controls the room."
                    : "Follow the host's playback. Playback controls are locked except mute."}
                </p>

                <Button variant="destructive" onClick={handleLeave} className="w-full">
                  <LogOut className="w-4 h-4" /> Leave watch party
                </Button>
              </div>
            )}

            {tab === "live" && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!party.state.roomId}
                  onClick={() =>
                    router.push(
                      `/party?room=${party.state.roomId ?? ""}`
                    )
                  }
                >
                  <Maximize2 className="w-4 h-4" /> Open full-screen view
                </Button>
                <WatchPartyCall
                  call={party.call}
                  members={party.state.members}
                  myName={myName}
                />
              </div>
            )}

            {tab === "chat" && (
              <div className="flex flex-col">
                <div className="rounded-lg border flex-1 flex flex-col min-h-[260px]">
                  <div className="flex flex-col gap-2 h-56 overflow-y-auto p-3 flex-1">
                    {party.state.chat.length === 0 ? (
                      <p className="text-xs text-muted-foreground m-auto">
                        No messages yet. Say hi!
                      </p>
                    ) : (
                      party.state.chat.map((msg) => (
                        <div key={msg.id} className="flex gap-2 items-start text-sm">
                          <Avatar className="w-6 h-6 shrink-0">
                            {msg.image ? <AvatarImage src={msg.image} /> : null}
                            <AvatarFallback>{(msg.name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-xs">{msg.name || "Guest"}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatChatTime(msg.at)}
                              </span>
                            </div>
                            <p className="text-sm leading-snug break-words">{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form
                    className="flex gap-2 border-t p-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                  >
                    <Input
                      placeholder="Message"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      maxLength={1000}
                      className="h-9"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      disabled={!chatText.trim()}
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          You're watching as <span className="font-medium">{myName}</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {children}
    </div>
  );
}
