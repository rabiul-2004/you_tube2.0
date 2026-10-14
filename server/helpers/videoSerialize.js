import { hasActivePaidPlan } from "./plan.js";

/**
 * Serialize a video (mongoose doc or plain object) for a given viewer, hiding
 * the playable URL of premium videos from users who aren't entitled to it.
 * The uploader always keeps access to their own video.
 */
export function serializeVideo(file, user) {
  if (!file) return file;
  const obj = file.toObject ? file.toObject() : { ...file };
  const isOwner = user && obj.uploader && String(obj.uploader) === String(user._id);
  if (obj.isPremium && !isOwner && !hasActivePaidPlan(user)) {
    delete obj.filepath;
  }
  return obj;
}

/** Map an array of videos through serializeVideo. */
export function serializeVideos(files, user) {
  return (files || []).map((f) => serializeVideo(f, user));
}
