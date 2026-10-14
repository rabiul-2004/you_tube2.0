import { v2 as cloudinary } from "cloudinary";

const FOLDER = "yourtube";
const UPLOAD_PRESET = "yourtube";

function ensureConfig() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export function generateVideoSignature(userId) {
  ensureConfig();
  const timestamp = Math.round(Date.now() / 1000) + 300;
  // Scope uploads to a per-user folder so one user can never delete another
  // user's assets (deletion is validated against this same folder prefix).
  const folder = userId ? userFolder(userId) : FOLDER;
  const sig = cloudinary.utils.sign_request({
    folder,
    timestamp,
    upload_preset: UPLOAD_PRESET,
  });
  return {
    signature: sig.signature,
    timestamp,
    apiKey: sig.api_key || process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
    uploadPreset: UPLOAD_PRESET,
  };
}

export function userFolder(userId) {
  return userId ? `${FOLDER}/${String(userId)}` : FOLDER;
}

/**
 * Derive a Cloudinary public_id from a stored URL.
 * Returns null unless the URL actually points at OUR Cloudinary cloud, so a
 * crafted URL can never be used to delete an asset on someone else's account.
 *
 * @param {string} filepath  the stored Cloudinary URL
 * @param {object} [opts]
 * @param {string} [opts.prefix]  when set, the public_id must start with this
 *   (used to confine deletion to the requesting user's own folder).
 */
export function extractPublicId(filepath, opts = {}) {
  if (!filepath || typeof filepath !== "string" || !filepath.startsWith("http")) {
    return null;
  }
  let url;
  try {
    url = new URL(filepath);
  } catch {
    return null;
  }
  if (url.hostname !== "res.cloudinary.com") return null;

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const parts = url.pathname.split("/").filter(Boolean);
  // Path shape: /<cloudName>/<resource_type>/upload/...
  if (!cloud || parts[0] !== cloud) return null;

  const uploadIdx = parts.indexOf("upload");
  if (uploadIdx === -1) return null;
  let rest = parts.slice(uploadIdx + 1);
  if (rest.length && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
  const publicId = rest.join("/").replace(/\.[^.]+$/, "");
  if (!publicId) return null;
  if (opts.prefix && !publicId.startsWith(opts.prefix)) return null;
  return publicId;
}

/**
 * Delete a Cloudinary asset. Pass `opts.prefix` (the user's own folder) to
 * guarantee the asset belongs to that user before destroying it.
 */
export async function deleteFromCloudinary(filepath, resourceType = "video", opts = {}) {
  ensureConfig();
  const publicId = extractPublicId(filepath, opts);
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return null;
  }
}
