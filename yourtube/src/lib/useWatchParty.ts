import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { VideoPlayerHandle } from "@/components/Videopplayer";

export interface PartyMember {
  socketId: string;
  name: string;
  image: string;
  isHost: boolean;
  micOn?: boolean;
  camOn?: boolean;
}

export interface PartyChatMessage {
  id: string;
  socketId: string;
  name: string;
  image: string;
  text: string;
  at: string;
}

export interface PartyState {
  roomId: string | null;
  isHost: boolean;
  videoId: string | null;
  members: PartyMember[];
  chat: PartyChatMessage[];
  error: string | null;
  connecting: boolean;
}

interface UseWatchPartyArgs {
  socket: Socket | null;
  videoId: string;
  playerRef: React.RefObject<VideoPlayerHandle | null>;
}

const HEARTBEAT_MS = 3000;
const DRIFT_THRESHOLD = 0.8;
const ACK_TIMEOUT_MS = 8000;

export function useWatchParty({ socket, videoId, playerRef }: UseWatchPartyArgs) {
  const [state, setState] = useState<PartyState>({
    roomId: null,
    isHost: false,
    videoId: null,
    members: [],
    chat: [],
    error: null,
    connecting: false,
  });
  const playerRefInner = playerRef;
  const lastHostPos = useRef<{ pos: number; playing: boolean } | null>(null);

  const update = useCallback((patch: Partial<PartyState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const createRoom = useCallback(
    (ack?: (ok: boolean, roomId?: string) => void) => {
      if (!socket) return ack?.(false);
      update({ connecting: true, error: null });
      const timer = setTimeout(() => {
        update({ connecting: false, error: "Timed out connecting to the server. Is the backend running?" });
        ack?.(false);
      }, ACK_TIMEOUT_MS);
      socket.emit("room:create", { videoId }, (res: any) => {
        clearTimeout(timer);
        if (res?.ok) {
          update({
            connecting: false,
            roomId: res.roomId,
            isHost: true,
            videoId: res.videoId,
            members: res.members || [],
            chat: res.chat || [],
          });
          ack?.(true, res.roomId);
        } else {
          update({ connecting: false, error: res?.error || "Failed to create room" });
          ack?.(false);
        }
      });
    },
    [socket, videoId, update]
  );

  const joinRoom = useCallback(
    (roomId: string, ack?: (ok: boolean) => void) => {
      if (!socket) return ack?.(false);
      update({ connecting: true, error: null });
      if (playerRefInner.current) {
        playerRefInner.current.pause();
      }
      const timer = setTimeout(() => {
        update({ connecting: false, error: "Timed out joining the room. Room may have expired." });
        ack?.(false);
      }, ACK_TIMEOUT_MS);
      socket.emit("room:join", { roomId }, (res: any) => {
        clearTimeout(timer);
        if (res?.ok) {
          update({
            connecting: false,
            roomId: res.roomId,
            isHost: res.isHost,
            videoId: res.videoId,
            members: res.members || [],
            chat: res.chat || [],
          });
          if (playerRefInner.current) {
            playerRefInner.current.seekTo(res.state?.position ?? 0);
          }
          ack?.(true);
        } else {
          update({ connecting: false, error: res?.error || "Failed to join room" });
          ack?.(false);
        }
      });
    },
    [socket, update, playerRefInner]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("room:leave", () => {});
    update({
      roomId: null,
      isHost: false,
      videoId: null,
      members: [],
      chat: [],
      error: null,
    });
  }, [socket, update]);

  const sendChat = useCallback(
    (text: string) => {
      if (!socket || !text.trim()) return;
      socket.emit("chat:message", { text });
    },
    [socket]
  );

  const setMedia = useCallback(
    (micOn: boolean, camOn: boolean) => {
      socket?.emit("media:toggle", { micOn, camOn });
    },
    [socket]
  );

  useEffect(() => {
    if (!socket) return;
    const onMemberJoined = ({ members }: { members: PartyMember[] }) =>
      update({ members });
    const onMemberLeft = ({ members }: { members: PartyMember[] }) =>
      update({ members });
    const onHostChange = ({ hostId }: { hostId: string }) =>
      update({ isHost: hostId === localSocketId(socket) });
    const onMediaToggle = ({ members }: { members: PartyMember[] }) =>
      update({ members });
    const onChat = (msg: PartyChatMessage) =>
      setState((s) => ({ ...s, chat: [...s.chat, msg] }));
    const onToast = ({ message }: { message: string }) => toastMessage(message);

    const onControlPlay = ({ position }: { position: number }) => {
      const p = playerRefInner.current;
      if (p) {
        p.pause();
        p.seekTo(position);
        p.play();
      }
    };
    const onControlPause = ({ position }: { position: number }) => {
      const p = playerRefInner.current;
      if (p) {
        p.pause();
        p.seekTo(position);
      }
    };
    const onControlSeek = ({ position }: { position: number }) => {
      playerRefInner.current?.seekTo(position);
    };
    const onHeartbeat = (data: {
      position: number;
      isPlaying: boolean;
      at: number;
    }) => {
      const p = playerRefInner.current;
      if (!p) return;
      const localPos = p.getPosition();
      if (Math.abs(localPos - data.position) > DRIFT_THRESHOLD) {
        p.seekTo(data.position);
      }
      if (data.isPlaying && !p.isPlaying()) {
        p.play();
      } else if (!data.isPlaying && p.isPlaying()) {
        p.pause();
      }
    };

    socket.on("member:joined", onMemberJoined);
    socket.on("member:left", onMemberLeft);
    socket.on("room:hostChange", onHostChange);
    socket.on("media:toggle", onMediaToggle);
    socket.on("chat:message", onChat);
    socket.on("room:toast", onToast);
    socket.on("control:play", onControlPlay);
    socket.on("control:pause", onControlPause);
    socket.on("control:seek", onControlSeek);
    socket.on("sync:heartbeat", onHeartbeat);

    return () => {
      socket.off("member:joined", onMemberJoined);
      socket.off("member:left", onMemberLeft);
      socket.off("room:hostChange", onHostChange);
      socket.off("media:toggle", onMediaToggle);
      socket.off("chat:message", onChat);
      socket.off("room:toast", onToast);
      socket.off("control:play", onControlPlay);
      socket.off("control:pause", onControlPause);
      socket.off("control:seek", onControlSeek);
      socket.off("sync:heartbeat", onHeartbeat);
    };
  }, [socket, update, playerRefInner]);

  // Host-driven emit loop: when host is in a room, watch the player and broadcast
  useEffect(() => {
    if (!socket || !state.roomId || !state.isHost) return;
    const tick = () => {
      const p = playerRefInner.current;
      if (!p) return;
      const pos = p.getPosition();
      const playing = p.isPlaying();
      const prev = lastHostPos.current;
      if (!prev) {
        lastHostPos.current = { pos, playing };
        return;
      }
      if (playing !== prev.playing) {
        socket.emit(playing ? "control:play" : "control:pause", { position: pos });
      } else if (Math.abs(pos - prev.pos) > 1.5) {
        socket.emit("control:seek", { position: pos });
      }
      lastHostPos.current = { pos, playing };
    };
    const iv = setInterval(tick, 500);
    return () => {
      clearInterval(iv);
      lastHostPos.current = null;
    };
  }, [socket, playerRefInner, state.roomId, state.isHost]);

  // Heartbeat broadcast (host) every ~3s for drift correction
  useEffect(() => {
    if (!socket || !state.roomId || !state.isHost) return;
    const iv = setInterval(() => {
      const p = playerRefInner.current;
      if (!p) return;
      socket.emit("sync:heartbeat", { position: p.getPosition(), isPlaying: p.isPlaying() });
    }, HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [socket, playerRefInner, state.roomId, state.isHost]);

  const roomUrl =
    state.roomId && typeof window !== "undefined"
      ? `${window.location.origin}/watch/${state.videoId}?party=${state.roomId}`
      : null;

  return {
    ...state,
    roomUrl,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChat,
    setMedia,
  };
}

function localSocketId(socket: Socket) {
  return socket?.id || "";
}

function toastMessage(message: string) {
  if (typeof window === "undefined") return;
  import("sonner").then(({ toast }) => toast(message));
}
