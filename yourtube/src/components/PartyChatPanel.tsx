"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatChatTime } from "@/lib/videoUtils";
import { useWatchParty } from "@/lib/WatchPartyProvider";

export default function PartyChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const party = useWatchParty();
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [party.state.chat, open]);

  if (!open) return null;

  const handleSend = () => {
    const text = chatText.trim();
    if (!text) return;
    party.sendChat(text);
    setChatText("");
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed top-0 right-0 z-[61] h-full w-[340px] max-w-[85vw] bg-background border-l border-border flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between gap-2 p-3 border-b">
          <span className="text-sm font-medium">Party chat</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close chat">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 flex-1 overflow-y-auto p-3">
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
          className="flex gap-2 border-t p-3"
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
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!chatText.trim()} aria-label="Send message">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </aside>
    </>
  );
}
