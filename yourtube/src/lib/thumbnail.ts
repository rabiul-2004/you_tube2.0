export async function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "auto";
    el.muted = true;
    el.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(url);
    const fail = () => {
      cleanup();
      resolve(null);
    };

    const timeout = setTimeout(fail, 10000);

    el.onerror = fail;
    el.onloadedmetadata = () => {
      if (!Number.isFinite(el.duration) || el.duration <= 0) {
        clearTimeout(timeout);
        fail();
        return;
      }
      el.currentTime = Math.min(el.duration * 0.25, Math.max(el.duration - 0.1, 0));
    };
    el.onseeked = () => {
      try {
        const scale = Math.min(1, 640 / (el.videoWidth || 640));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round((el.videoWidth || 640) * scale);
        canvas.height = Math.round((el.videoHeight || 360) * scale);
        canvas.getContext("2d")?.drawImage(el, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            cleanup();
            resolve(blob);
          },
          "image/jpeg",
          0.75
        );
      } catch {
        clearTimeout(timeout);
        fail();
      }
    };
    el.src = url;
  });
}
