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

export function generateVideoSignature() {
  ensureConfig();
  const timestamp = Math.round(Date.now() / 1000) + 300;
  const sig = cloudinary.utils.sign_request({
    folder: FOLDER,
    timestamp,
    upload_preset: UPLOAD_PRESET,
  });
  return {
    signature: sig.signature,
    timestamp,
    apiKey: sig.api_key || process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: FOLDER,
    uploadPreset: UPLOAD_PRESET,
  };
}

export function extractPublicId(filepath) {
  if (!filepath || !filepath.startsWith("http")) return null;
  const parts = filepath.split("/");
  const uploadIdx = parts.indexOf("upload");
  if (uploadIdx === -1) return null;
  let rest = parts.slice(uploadIdx + 1);
  if (rest.length && /^v\d+$/.test(rest[0])) rest = rest.slice(1);
  return rest.join("/").replace(/\.[^.]+$/, "");
}

export async function deleteFromCloudinary(filepath) {
  ensureConfig();
  const publicId = extractPublicId(filepath);
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    return result;
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return null;
  }
}
