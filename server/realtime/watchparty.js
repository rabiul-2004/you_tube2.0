import { verifyIdToken } from "../middleware/auth.js";
import {
  createRoom,
  getRoom,
  addMember,
  removeMember,
  getMember,
  isHost,
  setHost,
  listMembers,
  isEmpty,
  deleteRoom,
  pushChat,
  getChat,
} from "./rooms.js";

const HEARTBEAT_MS = 3000;
// How long the original host keeps the right to reclaim host control after a
// disconnect (page refresh / brief network drop) before it's handed over.
const HOST_RECLAIM_MS = 30000;

export function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const auth = await verifyIdToken(token);
      socket.auth = auth;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const roomRef = { current: null };

    const buildMember = (isHost) => ({
      socketId: socket.id,
      uid: socket.auth?.uid || null,
      name: socket.auth.name || "Guest",
      image: socket.auth.picture || "",
      isHost,
      micOn: false,
      camOn: false,
      inCall: false,
    });

    const leaveCurrentRoom = () => {
      const room = roomRef.current;
      if (!room) return;
      const wasHost = isHost(room, socket.id);
      const departingUid = socket.auth?.uid || null;
      removeMember(room, socket.id);
      socket.leave(room.id);
      io.to(room.id).emit("member:left", {
        socketId: socket.id,
        members: listMembers(room),
      });
      if (wasHost) {
        // Hold the departing host's slot so they can reclaim after a refresh /
        // brief disconnect, then promote a temporary host for the meantime.
        if (departingUid) {
          room.reclaimHostUid = departingUid;
          room.reclaimUntil = Date.now() + HOST_RECLAIM_MS;
        }
        const remaining = listMembers(room);
        if (remaining.length > 0) {
          setHost(room, remaining[0].socketId, remaining[0].uid);
          io.to(room.id).emit("room:hostChange", { hostId: room.hostId });
          io.to(room.id).emit("room:toast", {
            message: `${remaining[0]?.name || "A participant"} is hosting while the host reconnects`,
          });
        }
      }
      if (isEmpty(room)) {
        deleteRoom(room.id);
        roomRef.current = null;
        return;
      }
      roomRef.current = null;
    };

    socket.on("room:create", (payload, ack) => {
      try {
        const videoId = payload?.videoId;
        if (!videoId) return ack?.({ ok: false, error: "videoId required" });
        const room = createRoom({
          hostId: socket.id,
          videoId: String(videoId),
          hostUid: socket.auth?.uid || null,
        });
        const member = buildMember(true);
        roomRef.current = room;
        addMember(room, socket.id, member);
        socket.join(room.id);
        ack?.({
          ok: true,
          roomId: room.id,
          videoId: room.videoId,
          state: room.state,
          members: listMembers(room),
          isHost: true,
        });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("room:join", (payload, ack) => {
      try {
        const roomId = payload?.roomId;
        const room = roomId ? getRoom(roomId) : null;
        if (!room) return ack?.({ ok: false, error: "Room not found" });
        const existing = getMember(room, socket.id);
        if (existing) {
          // Already a member (e.g. followed the host to a new video) — idempotent re-join.
          socket.join(room.id);
          return ack?.({
            ok: true,
            roomId: room.id,
            videoId: room.videoId,
            state: room.state,
            members: listMembers(room),
            chat: getChat(room),
            isHost: isHost(room, socket.id),
          });
        }
        const member = buildMember(false);
        roomRef.current = room;
        // If the rightful (original) host rejoins within the reclaim window,
        // hand host control back to them (e.g. after they refreshed the page).
        const rejoiningUid = socket.auth?.uid || null;
        let reclaimed = false;
        if (
          rejoiningUid &&
          room.reclaimHostUid === rejoiningUid &&
          Date.now() < room.reclaimUntil
        ) {
          reclaimed = true;
          room.reclaimHostUid = null;
          room.reclaimUntil = 0;
          member.isHost = true;
        }
        addMember(room, socket.id, member);
        if (reclaimed) {
          setHost(room, socket.id, rejoiningUid);
          io.to(room.id).emit("room:hostChange", { hostId: room.hostId });
          io.to(room.id).emit("room:toast", {
            message: `${member.name} is back and hosting again`,
          });
        }
        socket.join(room.id);
        io.to(room.id).emit("room:toast", {
          message: `${member.name} joined the watch party`,
        });
        io.to(room.id).emit("member:joined", {
          member,
          members: listMembers(room),
        });
        ack?.({
          ok: true,
          roomId: room.id,
          videoId: room.videoId,
          state: room.state,
          members: listMembers(room),
          chat: getChat(room),
          isHost: isHost(room, socket.id),
        });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("room:leave", (ack) => {
      leaveCurrentRoom();
      ack?.({ ok: true });
    });

    socket.on("room:info", (payload, ack) => {
      try {
        const roomId = payload?.roomId;
        const room = roomId ? getRoom(roomId) : null;
        if (!room) return ack?.({ ok: false, error: "Room not found" });
        ack?.({
          ok: true,
          roomId: room.id,
          videoId: room.videoId,
          members: listMembers(room),
        });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("room:setVideo", (payload, ack) => {
      const room = roomRef.current;
      if (!room || !isHost(room, socket.id)) return ack?.({ ok: false });
      const videoId = String(payload?.videoId || "");
      if (!videoId) return ack?.({ ok: false, error: "videoId required" });
      room.videoId = videoId;
      room.state = { isPlaying: false, position: 0 };
      socket.broadcast.to(room.id).emit("room:videoChange", {
        roomId: room.id,
        videoId,
        by: socket.id,
        at: Date.now(),
      });
      ack?.({ ok: true, videoId, state: room.state });
    });

    socket.on("control:play", (payload, ack) => {
      const room = roomRef.current;
      if (!room || !isHost(room, socket.id)) return ack?.({ ok: false });
      const position = Number(payload?.position ?? room.state.position) || 0;
      room.state = { isPlaying: true, position };
      socket.broadcast.to(room.id).emit("control:play", {
        position,
        by: socket.id,
        at: Date.now(),
      });
      ack?.({ ok: true, state: room.state });
    });

    socket.on("control:pause", (_, ack) => {
      const room = roomRef.current;
      if (!room || !isHost(room, socket.id)) return ack?.({ ok: false });
      const position = Number(room.state.position) || 0;
      room.state = { isPlaying: false, position };
      socket.broadcast.to(room.id).emit("control:pause", {
        position,
        by: socket.id,
        at: Date.now(),
      });
      ack?.({ ok: true, state: room.state });
    });

    socket.on("control:seek", (payload, ack) => {
      const room = roomRef.current;
      if (!room || !isHost(room, socket.id)) return ack?.({ ok: false });
      const position = Math.max(
        0,
        Number(payload?.position ?? room.state.position) || 0
      );
      room.state = { ...room.state, position };
      socket.broadcast.to(room.id).emit("control:seek", {
        position,
        by: socket.id,
        at: Date.now(),
      });
      ack?.({ ok: true, state: room.state });
    });

    socket.on("sync:heartbeat", (payload, ack) => {
      const room = roomRef.current;
      if (!room || !isHost(room, socket.id)) return;
      const position = Math.max(
        0,
        Number(payload?.position ?? room.state.position) || 0
      );
      const isPlaying = !!payload?.isPlaying;
      if (isPlaying) room.state = { isPlaying: true, position };
      else room.state = { ...room.state, position };
      const t = Date.now();
      socket.broadcast.to(room.id).emit("sync:heartbeat", {
        position,
        isPlaying,
        at: t,
      });
      ack?.({ at: t, state: room.state });
    });

    socket.on("media:toggle", (payload, ack) => {
      const room = roomRef.current;
      if (!room) return ack?.({ ok: false });
      const update = {};
      if (typeof payload?.micOn === "boolean") update.micOn = payload.micOn;
      if (typeof payload?.camOn === "boolean") update.camOn = payload.camOn;
      const member = getMember(room, socket.id);
      if (!member) return ack?.({ ok: false });
      Object.assign(member, update);
      io.to(room.id).emit("media:toggle", {
        socketId: socket.id,
        ...update,
        members: listMembers(room),
      });
      ack?.({ ok: true, members: listMembers(room) });
    });

    socket.on("call:join", (ack) => {
      const room = roomRef.current;
      if (!room) return ack?.({ ok: false });
      const member = getMember(room, socket.id);
      if (!member) return ack?.({ ok: false });
      member.inCall = true;
      socket.broadcast.to(room.id).emit("call:join", {
        socketId: socket.id,
        members: listMembers(room),
      });
      ack?.({ ok: true, members: listMembers(room) });
    });

    socket.on("call:leave", (ack) => {
      const room = roomRef.current;
      if (!room) return ack?.({ ok: false });
      const member = getMember(room, socket.id);
      if (member) {
        member.inCall = false;
        member.micOn = false;
        member.camOn = false;
      }
      socket.broadcast.to(room.id).emit("call:leave", {
        socketId: socket.id,
        members: listMembers(room),
      });
      ack?.({ ok: true, members: listMembers(room) });
    });

    socket.on("chat:message", (payload, ack) => {
      const room = roomRef.current;
      if (!room) return ack?.({ ok: false });
      const text = String(payload?.text || "").slice(0, 1000).trim();
      if (!text) return ack?.({ ok: false });
      const message = pushChat(room, {
        id: `${socket.id}-${Date.now()}`,
        socketId: socket.id,
        name: socket.auth.name || "Guest",
        image: socket.auth.picture || "",
        text,
        at: new Date().toISOString(),
      });
      io.to(room.id).emit("chat:message", message);
      ack?.({ ok: true, message });
    });

    socket.on("disconnect", () => {
      leaveCurrentRoom();
    });

    // Keep room alive idle timeout
    const idleTimer = setInterval(() => {
      const room = roomRef.current;
      if (room && Date.now() - room.createdAt > 1000 * 60 * 60 * 6) {
        socket.emit("room:expired");
        leaveCurrentRoom();
      }
    }, 1000 * 60 * 10);
    idleTimer.unref?.();
  });

  return io;
}
