"use client";

import { useState } from "react";
import { Video, Loader2, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { getSocket } from "@/lib/watchparty";

interface WatchPartyJoinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WatchPartyJoinDialog({
  open,
  onOpenChange,
}: WatchPartyJoinDialogProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const roomId = code.trim();
    if (!roomId || loading) return;
    setLoading(true);
    try {
      const socket = await getSocket();
      const res: any = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("Timed out finding the room")), 8000);
        socket.emit("room:info", { roomId }, (r: any) => {
          clearTimeout(t);
          resolve(r);
        });
      });
      if (!res?.ok) {
        toast.error(
          res?.error === "Room not found"
            ? "Room not found. Check the code and try again."
            : res?.error || "Could not find that room"
        );
        return;
      }
      onOpenChange(false);
      setCode("");
      router.push(`/watch/${res.videoId}?party=${res.roomId}`);
    } catch (e: any) {
      toast.error(e?.message || "Could not connect to the watch party server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" /> Join a Watch Party
          </DialogTitle>
          <DialogDescription>
            Enter the party code from an invite link to watch it in sync.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoin();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Party code (e.g. aB3xYz9)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <Button type="submit" disabled={!code.trim() || loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Join
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            You'll be taken to the video the party is watching and joined automatically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
