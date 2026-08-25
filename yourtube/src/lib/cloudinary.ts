import { BASE_URL } from "./axiosinstance";

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadPreset: string;
}

export async function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
  onProgress?: (pct: number) => void
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("signature", signature.signature);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("folder", signature.folder);
  formData.append("upload_preset", signature.uploadPreset);
  formData.append("resource_type", "video");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        console.error("Cloudinary error:", xhr.status, xhr.responseText);
        reject(new Error(`Cloudinary ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export function getVideoUrl(filepath?: string): string {
  if (!filepath) return "";
  if (filepath.startsWith("http")) return filepath;
  return `${BASE_URL}/${filepath}`;
}

export async function uploadImageToCloudinary(
  file: File | Blob,
  signature: UploadSignature,
  onProgress?: (pct: number) => void
): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("signature", signature.signature);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("folder", signature.folder);
  formData.append("upload_preset", signature.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        console.error("Cloudinary image error:", xhr.status, xhr.responseText);
        reject(new Error(`Cloudinary ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}
