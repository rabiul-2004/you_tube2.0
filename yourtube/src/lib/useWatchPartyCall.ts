"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Peer, { MediaConnection } from "peerjs";
import { getPeerUrl } from "./watchparty";
import type { Socket } from "socket.io-client";
import type { PartyMember } from "./WatchPartyProvider";

export interface WatchPartyCallApi {
  inCall: boolean;
  joining: boolean;
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  joinCall: () => Promise<void>;
  leaveCall: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleShare: () => Promise<void>;
}

function setTrackEnabled(
  stream: MediaStream | null,
  kind: "audio" | "video",
  enabled: boolean
) {
  stream
    ?.getTracks()
    .filter((t) => t.kind === kind)
    .forEach((t) => {
      t.enabled = enabled;
    });
}

export function useWatchPartyCall(params: {
  socket: Socket | null;
  myId: string | null;
  roomId: string | null;
  isHost: boolean;
  members: PartyMember[];
}): WatchPartyCallApi {
  const { socket, myId, roomId, members } = params;

  const [inCall, setInCall] = useState(false);
  const [joining, setJoining] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const peerRef = useRef<Peer | null>(null);
  const callsRef = useRef<Map<string, MediaConnection>>(new Map());
  const streamRef = useRef<MediaStream | null>(null);
  const shareRef = useRef<MediaStream | null>(null);

  const inCallRef = useRef(inCall);
  inCallRef.current = inCall;
  const micOnRef = useRef(micOn);
  micOnRef.current = micOn;
  const camOnRef = useRef(camOn);
  camOnRef.current = camOn;
  const sharingRef = useRef(sharing);
  sharingRef.current = sharing;

  // Merge the local participant into the members list so the mesh can see us.
  const effectiveMembers = useMemo(() => {
    if (!inCall || !myId) return members;
    const self: PartyMember = {
      socketId: myId,
      name: "You",
      image: "",
      isHost: params.isHost,
      micOn,
      camOn,
      inCall: true,
    };
    return [self, ...members.filter((m) => m.socketId !== myId)];
  }, [inCall, myId, members, micOn, camOn, params.isHost]);

  const wireCall = useCallback((call: MediaConnection) => {
    const from = call.peer;
    call.on("stream", (remoteStream) => {
      setRemoteStreams((prev) => ({ ...prev, [from]: remoteStream }));
    });
    call.on("close", () => {
      callsRef.current.delete(from);
      setRemoteStreams((prev) => {
        if (!prev[from]) return prev;
        const next = { ...prev };
        delete next[from];
        return next;
      });
    });
  }, []);

  const stopAll = useCallback(() => {
    for (const [, call] of callsRef.current) {
      try {
        call.close();
      } catch {
        // already closed
      }
    }
    callsRef.current.clear();
    shareRef.current?.getTracks().forEach((t) => t.stop());
    shareRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLocalStream(null);
    try {
      peerRef.current?.destroy();
    } catch {
      // noop
    }
    peerRef.current = null;
  }, []);

  // Unmount cleanup (page navigation away from the watch page).
  useEffect(() => () => stopAll(), [stopAll]);

  const joinCall = useCallback(async () => {
    if (inCallRef.current || !myId || !roomId) return;
    setJoining(true);
    try {
      let stream: MediaStream;
      let hasCam = true;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: true,
        });
      } catch {
        // Camera blocked/unavailable -> join audio-only (or silent listen).
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        hasCam = false;
      }
      streamRef.current = stream;
      setLocalStream(stream);
      const startMic = stream.getAudioTracks().length > 0;
      const startCam = hasCam && stream.getVideoTracks().length > 0;
      setMicOn(startMic);
      setCamOn(startCam);
      micOnRef.current = startMic;
      camOnRef.current = startCam;

      const peerConfig = getPeerUrl();
      if (!peerConfig) throw new Error("Peer server URL unavailable");
      const peer = new Peer(myId, {
        host: peerConfig.host,
        port: peerConfig.port,
        path: peerConfig.path,
        secure: peerConfig.secure,
        debug: 0,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });
      peerRef.current = peer;

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Peer server timed out. Is the backend running?")),
          10000
        );
        peer.on("open", () => {
          clearTimeout(timer);
          resolve();
        });
        peer.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      // Answer incoming calls from peers (deterministic mesh non-initiators).
      peer.on("call", (incoming) => {
        const from = incoming.peer;
        if (from === myId) return;
        incoming.answer(streamRef.current || new MediaStream());
        callsRef.current.set(from, incoming);
        wireCall(incoming);
      });

      // Announce presence so other members start meshing with us.
      socket?.emit("call:join", () => {});
      socket?.emit("media:toggle", { micOn: startMic, camOn: startCam });

      setInCall(true);
      setJoining(false);
    } catch (error) {
      console.error("[watch-party-call] could not join call:", error);
      stopAll();
      setJoining(false);
      setInCall(false);
    }
  }, [myId, roomId, socket, stopAll, wireCall]);

  const leaveCall = useCallback(() => {
    if (!inCallRef.current) return;
    socket?.emit("call:leave", () => {});
    stopAll();
    setSharing(false);
    setMicOn(true);
    setCamOn(true);
    setRemoteStreams({});
    setInCall(false);
  }, [socket, stopAll]);

  // Mesh reconciliation: add missing connections (deterministic initiator = lower id),
  // drop connections for members who left the call.
  useEffect(() => {
    const peer = peerRef.current;
    if (!peer || !inCall || !myId) return;
    const targets = effectiveMembers.filter((m) => m.inCall && m.socketId !== myId);
    const targetIds = new Set(targets.map((m) => m.socketId));

    for (const m of targets) {
      const id = m.socketId;
      if (callsRef.current.has(id)) continue;
      if (myId > id) continue; // the other peer initiates; we answer
      const outgoing = peer.call(id, streamRef.current || new MediaStream(), {
        metadata: { name: m.name },
      });
      callsRef.current.set(id, outgoing);
      wireCall(outgoing);
    }

    for (const [id, call] of callsRef.current) {
      if (targetIds.has(id)) continue;
      try {
        call.close();
      } catch {
        // noop
      }
      callsRef.current.delete(id);
      setRemoteStreams((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [inCall, effectiveMembers, myId, wireCall]);

  const toggleMic = useCallback(() => {
    if (!inCallRef.current) return;
    const next = !micOnRef.current;
    setMicOn(next);
    micOnRef.current = next;
    setTrackEnabled(streamRef.current, "audio", next);
    socket?.emit("media:toggle", { micOn: next, camOn: camOnRef.current });
  }, [socket]);

  const toggleCam = useCallback(() => {
    if (!inCallRef.current || sharingRef.current) return;
    const next = !camOnRef.current;
    setCamOn(next);
    camOnRef.current = next;
    setTrackEnabled(streamRef.current, "video", next);
    socket?.emit("media:toggle", { micOn: micOnRef.current, camOn: next });
  }, [socket]);

  const replaceVideoTracks = useCallback((track: MediaStreamTrack | null) => {
    for (const call of callsRef.current.values()) {
      const sender = call.peerConnection
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (!sender) continue;
      sender.replaceTrack(track).catch(() => {});
    }
  }, []);

  const toggleShare = useCallback(async () => {
    if (!inCallRef.current) return;
    if (sharingRef.current) {
      // Stop sharing and restore the camera feed (if on).
      const camTrack = camOnRef.current
        ? streamRef.current?.getVideoTracks()[0] ?? null
        : null;
      replaceVideoTracks(camTrack);
      shareRef.current?.getTracks().forEach((t) => t.stop());
      shareRef.current = null;
      setSharing(false);
      sharingRef.current = false;
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      shareRef.current = displayStream;
      const shareTrack = displayStream.getVideoTracks()[0];
      replaceVideoTracks(shareTrack);
      shareTrack.onended = () => {
        if (!sharingRef.current) return;
        const camTrack = camOnRef.current
          ? streamRef.current?.getVideoTracks()[0] ?? null
          : null;
        replaceVideoTracks(camTrack);
        setSharing(false);
        sharingRef.current = false;
      };
      setSharing(true);
      sharingRef.current = true;
    } catch (error) {
      console.error("[watch-party-call] screen share cancelled:", error);
    }
  }, [replaceVideoTracks]);

  return {
    inCall,
    joining,
    micOn,
    camOn,
    sharing,
    localStream,
    remoteStreams,
    joinCall,
    leaveCall,
    toggleMic,
    toggleCam,
    toggleShare,
  };
}