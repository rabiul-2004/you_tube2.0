"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { getSocket } from "./watchparty";
import { useUser } from "./AuthContext";
import { useWatchPartyCall } from "./useWatchPartyCall";
import type { Socket } from "socket.io-client";
import type { VideoPlayerHandle } from "@/components/Videopplayer";

export interface PartyMember {
  socketId: string;
  name: string;
  image: string;
  isHost: boolean;
  micOn?: boolean;
  camOn?: boolean;
  inCall?: boolean;
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

interface PartyApi {
  state: PartyState;
  roomUrl: string | null;
  myId: string | null;
  call: ReturnType<typeof useWatchPartyCall>;
  createRoom: (videoId: string, ack?: (ok: boolean, roomId?: string) => void) => void;
  joinRoom: (roomId: string, ack?: (ok: boolean) => void) => void;
  leaveRoom: () => void;
  setVideo: (videoId: string) => void;
  sendChat: (text: string) => void;
  registerPlayer: (ref: React.RefObject<VideoPlayerHandle | null> | null) => void;
}

const WatchPartyContext = createContext<PartyApi | null>(null);

const HEARTBEAT_MS = 3000;
const DRIFT_THRESHOLD = 0.8;
const ACK_TIMEOUT_MS = 8000;

export function WatchPartyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useUser();
  const [state, setState] = useState<PartyState>({
    roomId: null,
    isHost: false,
    videoId: null,
    members: [],
    chat: [],
    error: null,
    connecting: false,
  });
  const playerRefObj = useRef<React.RefObject<VideoPlayerHandle | null> | null>(null);
  const lastHostPos = useRef<{ pos: number; playing: boolean } | null>(null);
  // Last known play position while a player existed — used to restore playback
  // position when the /party view unmounts/remounts the video player.
  const preservedPos = useRef<{ position: number; playing: boolean } | null>(null);
  const lastVideoRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const getPlayer = () => playerRefObj.current?.current ?? null;

  const update = useCallback((patch: Partial<PartyState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const registerPlayer = useCallback((ref: React.RefObject<VideoPlayerHandle | null> | null) => {
    playerRefObj.current = ref;
    // When a player (re)mounts inside a live room — e.g. coming back from the
    // immersive /party view — restore the last known play position instead of
    // restarting the video from zero. Seeking before metadata is ready gets
    // clamped to 0, so retry until the position sticks.
    const restored = preservedPos.current;
    const roomId = stateRef.current.roomId;
    if (!ref?.current || !restored || !roomId) return;
    let tries = 0;
    const iv = setInterval(() => {
      tries += 1;
      const p = ref.current;
      if (!p) {
        if (tries >= 20) clearInterval(iv);
        return;
      }
      if (p.getPosition() >= restored.position - 1 && p.getPosition() > 0) {
        clearInterval(iv);
        return;
      }
      p.seekTo(restored.position);
      if (restored.playing) p.play();
      if (tries >= 20) clearInterval(iv);
    }, 300);
  }, []);

  // Socket connection (lazy, global singleton)
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const ensureSocket = useCallback(async () => {
    if (socketRef.current) return socketRef.current;
    const s = await getSocket();
    socketRef.current = s;
    setSocket(s);
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Wait until auth has restored before connecting, and retry once the
    // user is available (fixes the "sign-in required" race right after login).
    ensureSocket()
      .then((s) => {
        if (!cancelled) {
          setSocket(s);
          if (stateRef.current.error) update({ error: null });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e?.message || "Could not connect to the watch party server";
          update({ error: msg });
        }
      });
    return () => {
      cancelled = true;
    };
    // Re-run when the user first becomes available so a late sign-in retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(user)]);

  // After a full page refresh, rejoin the watch party the user was last in so
  // the host (and members) don't lose the room or host control.
  useEffect(() => {
    if (!socket || state.roomId) return;
    if (!user) return;
    const session = readSession();
    if (!session) return;
    if (session.roomId === state.roomId) return;
    joinRoom(session.roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, Boolean(user), state.roomId]);

  const call = useWatchPartyCall({
    socket,
    myId: socket?.id ?? null,
    roomId: state.roomId,
    isHost: state.isHost,
    members: state.members,
  });

  const createRoom = useCallback(
    (videoId: string, ack?: (ok: boolean, roomId?: string) => void) => {
      update({ connecting: true, error: null });
      ensureSocket()
        .then((s) => {
          const timer = setTimeout(() => {
            update({ connecting: false, error: "Timed out connecting to the server. Is the backend running?" });
            ack?.(false);
          }, ACK_TIMEOUT_MS);
          s.emit("room:create", { videoId }, (res: any) => {
            clearTimeout(timer);
            if (res?.ok) {
              lastVideoRef.current = res.videoId;
              persistSession({
                roomId: res.roomId,
                videoId: res.videoId,
                isHost: true,
              });
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
        })
        .catch((e) => {
          update({ connecting: false, error: e?.message || "Could not connect to the watch party server" });
          ack?.(false);
        });
    },
    [ensureSocket, update]
  );

  const joinRoom = useCallback(
    (roomId: string, ack?: (ok: boolean) => void) => {
      update({ connecting: true, error: null });
      ensureSocket()
        .then((s) => {
          const p = getPlayer();
          if (p) p.pause();
          const timer = setTimeout(() => {
            clearSession();
            update({ connecting: false, error: "Timed out joining the room. Room may have expired." });
            ack?.(false);
          }, ACK_TIMEOUT_MS);
          s.emit("room:join", { roomId }, (res: any) => {
            clearTimeout(timer);
            if (res?.ok) {
              lastVideoRef.current = res.videoId;
              persistSession({
                roomId: res.roomId,
                videoId: res.videoId,
                isHost: !!res.isHost,
              });
              // Keep the room's current position so the player can be restored
              // once it mounts (important right after a page refresh).
              preservedPos.current = {
                position: res.state?.position ?? 0,
                playing: false,
              };
              update({
                connecting: false,
                roomId: res.roomId,
                isHost: res.isHost,
                videoId: res.videoId,
                members: res.members || [],
                chat: res.chat || [],
              });
              const joinerPlayer = getPlayer();
              if (joinerPlayer) {
                joinerPlayer.seekTo(res.state?.position ?? 0);
              }
              ack?.(true);
              // Make sure we're on the room's current video after rejoining.
              if (typeof window !== "undefined") {
                const current = window.location.pathname;
                const target = `/watch/${res.videoId}?party=${res.roomId}`;
                if (current.startsWith("/watch/") && current !== `/watch/${res.videoId}`) {
                  router.replace(target);
                }
              }
            } else {
              clearSession();
              update({ connecting: false, error: res?.error || "Failed to join room" });
              ack?.(false);
            }
          });
        })
        .catch((e) => {
          update({ connecting: false, error: e?.message || "Could not connect to the watch party server" });
          ack?.(false);
        });
    },
    [ensureSocket, update]
  );

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    call.leaveCall();
    socketRef.current.emit("room:leave", () => {});
    lastVideoRef.current = null;
    lastHostPos.current = null;
    preservedPos.current = null;
    clearSession();
    update({
      roomId: null,
      isHost: false,
      videoId: null,
      members: [],
      chat: [],
      error: null,
    });
  }, [call, update]);

  const setVideo = useCallback(
    (videoId: string) => {
      const s = socketRef.current;
      if (!s || !state.roomId || !state.isHost) return;
      if (lastVideoRef.current === videoId) return;
      lastVideoRef.current = videoId;
      preservedPos.current = null;
      s.emit("room:setVideo", { videoId }, (res: any) => {
        if (res?.ok) {
          update({ videoId: res.videoId });
        }
      });
    },
    [state.roomId, state.isHost, update]
  );

  const sendChat = useCallback(
    (text: string) => {
      if (!socketRef.current || !text.trim()) return;
      socketRef.current.emit("chat:message", { text });
    },
    []
  );

  // Follow the host when the host switches videos (guests navigate to the new video)
  useEffect(() => {
    if (!socket) return;
    const onVideoChange = (data: { roomId: string; videoId: string }) => {
      if (!data || !data.videoId) return;
      if (stateRef.current.roomId && data.roomId !== stateRef.current.roomId) return;
      lastVideoRef.current = data.videoId;
      update({ videoId: data.videoId });
      if (typeof window === "undefined") return;
      const current = window.location.pathname;
      const target = `/watch/${data.videoId}?party=${data.roomId}`;
      // On the immersive /party view we only update the room's video id so the
      // "Back to watch" link stays correct; we don't redirect the party view.
      if (current === "/party") {
        return;
      }
      if (current === `/watch/${data.videoId}`) return;
      // Reset local playback for the new video before navigating
      preservedPos.current = null;
      const p = getPlayer();
      if (p) {
        p.pause();
        p.seekTo(0);
      }
      router.push(target);
    };

    socket.on("room:videoChange", onVideoChange);
    return () => {
      socket.off("room:videoChange", onVideoChange);
    };
  }, [socket, router, update]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    const onMemberJoined = ({ members }: { members: PartyMember[] }) => update({ members });
    const onMemberLeft = ({ members }: { members: PartyMember[] }) => update({ members });
    const onHostChange = ({ hostId }: { hostId: string }) => {
      update({ isHost: hostId === socket.id });
      const s = readSession();
      if (s) persistSession({ ...s, isHost: hostId === socket.id });
    };
    const onMediaToggle = ({ members }: { members: PartyMember[] }) => update({ members });
    const onCallJoin = ({ members }: { members: PartyMember[] }) => update({ members });
    const onCallLeave = ({ members }: { members: PartyMember[] }) => update({ members });
    const onChat = (msg: PartyChatMessage) =>
      setState((s) => ({ ...s, chat: [...s.chat, msg] }));
    const onToast = ({ message }: { message: string }) => toastMessage(message);

    const onControlPlay = ({ position }: { position: number }) => {
      const p = getPlayer();
      if (p) {
        p.pause();
        p.seekTo(position);
        p.play();
      }
    };
    const onControlPause = ({ position }: { position: number }) => {
      const p = getPlayer();
      if (p) {
        p.pause();
        p.seekTo(position);
      }
    };
    const onControlSeek = ({ position }: { position: number }) => {
      getPlayer()?.seekTo(position);
    };
    const onHeartbeat = (data: { position: number; isPlaying: boolean; at: number }) => {
      const p = getPlayer();
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
    socket.on("call:join", onCallJoin);
    socket.on("call:leave", onCallLeave);
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
      socket.off("call:join", onCallJoin);
      socket.off("call:leave", onCallLeave);
      socket.off("chat:message", onChat);
      socket.off("room:toast", onToast);
      socket.off("control:play", onControlPlay);
      socket.off("control:pause", onControlPause);
      socket.off("control:seek", onControlSeek);
      socket.off("sync:heartbeat", onHeartbeat);
    };
  }, [socket, update]);

  // Host-driven emit loop (host only, when a player is registered)
  useEffect(() => {
    if (!socket || !state.roomId || !state.isHost) return;
    const tick = () => {
      const p = getPlayer();
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
  }, [socket, state.roomId, state.isHost]);

  // Heartbeat broadcast (host)
  useEffect(() => {
    if (!socket || !state.roomId || !state.isHost) return;
    const iv = setInterval(() => {
      const p = getPlayer();
      if (!p) return;
      socket.emit("sync:heartbeat", { position: p.getPosition(), isPlaying: p.isPlaying() });
    }, HEARTBEAT_MS);
    return () => clearInterval(iv);
  }, [socket, state.roomId, state.isHost]);

  // Preserve the latest play position so returning from the /party view (which
  // unmounts this player) resumes where we left off instead of restarting at 0.
  useEffect(() => {
    if (!state.roomId) return;
    const iv = setInterval(() => {
      const p = getPlayer();
      if (p) {
        preservedPos.current = { position: p.getPosition(), playing: p.isPlaying() };
      }
    }, 500);
    return () => clearInterval(iv);
  }, [state.roomId]);

  const roomUrl =
    state.roomId && state.videoId && typeof window !== "undefined"
      ? `${window.location.origin}/watch/${state.videoId}?party=${state.roomId}`
      : null;

  const api: PartyApi = {
    state,
    roomUrl,
    myId: socket?.id ?? null,
    call,
    createRoom,
    joinRoom,
    leaveRoom,
    setVideo,
    sendChat,
    registerPlayer,
  };

  return (
    <WatchPartyContext.Provider value={api}>{children}</WatchPartyContext.Provider>
  );
}

export function useWatchParty(): PartyApi {
  const ctx = useContext(WatchPartyContext);
  if (!ctx) throw new Error("useWatchParty must be used within WatchPartyProvider");
  return ctx;
}

function toastMessage(message: string) {
  if (typeof window === "undefined") return;
  import("sonner").then(({ toast }) => toast(message));
}

// ---- Party session persistence (survives a full page refresh) ----
const SESSION_KEY = "watchparty:session";

function persistSession(data: { roomId: string; videoId: string; isHost: boolean }) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — non-fatal
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // non-fatal
  }
}

function readSession(): { roomId: string; videoId: string; isHost: boolean } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.roomId && data?.videoId) return data;
    return null;
  } catch {
    return null;
  }
}
