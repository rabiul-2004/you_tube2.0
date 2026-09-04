import { nanoid } from "nanoid";

const rooms = new Map();

export function createRoom({ hostId, videoId, hostUid }) {
  const id = nanoid(8);
  const room = {
    id,
    videoId,
    hostId,
    hostUid: hostUid || null,
    // Original creator's stable uid — used to let them reclaim host after a
    // brief disconnect/refresh instead of permanently losing control.
    originalHostUid: hostUid || null,
    // When set, a former host's slot is being held for `reclaimHostUid` until
    // `reclaimUntil` (ms). The rightful host can reclaim on rejoin meanwhile.
    reclaimHostUid: null,
    reclaimUntil: 0,
    state: { isPlaying: false, position: 0 },
    members: new Map(),
    chat: [],
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function addMember(room, socketId, member) {
  room.members.set(socketId, member);
  return member;
}

export function removeMember(room, socketId) {
  const member = room.members.get(socketId);
  room.members.delete(socketId);
  return member;
}

export function getMember(room, socketId) {
  return room.members.get(socketId) || null;
}

export function isHost(room, socketId) {
  return room.hostId === socketId;
}

export function setHost(room, socketId, uid) {
  room.hostId = socketId;
  if (uid) room.hostUid = uid;
}

export function getMemberByUid(room, uid) {
  if (!uid) return null;
  for (const member of room.members.values()) {
    if (member.uid === uid) return member;
  }
  return null;
}

export function listMembers(room) {
  return Array.from(room.members.entries()).map(([socketId, member]) => ({
    socketId,
    ...member,
  }));
}

export function isEmpty(room) {
  return room.members.size === 0;
}

export function deleteRoom(roomId) {
  rooms.delete(roomId);
}

export function pushChat(room, message) {
  room.chat.push(message);
  if (room.chat.length > 500) {
    room.chat.splice(0, room.chat.length - 500);
  }
  return message;
}

export function getChat(room) {
  return room.chat;
}
