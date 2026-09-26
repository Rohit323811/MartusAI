"use client";

/**
 * Downscale to maxEdge on the longest edge and return base64 (no
 * data: prefix). Re-drawing through canvas drops EXIF automatically,
 * so this also serves as stripExif.
 */
export async function downscaleImage(
  file: File,
  maxEdge = 1600
): Promise<{ base64: string; mimeType: string }> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);

  const mimeType = "image/jpeg"; // re-encode: normalizes PNG/WebP too
  const dataUrl = canvas.toDataURL(mimeType, 0.85);
  return { base64: dataUrl.split(",")[1] ?? "", mimeType };
}

/** Combined convenience: downscale + EXIF strip in one pass. */
export async function stripExif(file: File): Promise<File> {
  const { base64 } = await downscaleImage(file);
  const byteString = atob(base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
  return new File([bytes], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image. Try a different file."));
    };
    img.src = url;
  });
}
