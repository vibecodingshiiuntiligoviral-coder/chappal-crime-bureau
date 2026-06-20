import type { PreparedCaseImage } from "@/types";

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
const MAX_SOURCE_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function revokeUrl(url: string) {
  if (typeof URL !== "undefined") {
    URL.revokeObjectURL(url);
  }
}

function getFileExtension(fileName: string) {
  const lowered = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.find((extension) => lowered.endsWith(extension)) ?? "";
}

async function loadImageFromBlob(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not read that image file."));
      element.src = objectUrl;
    });

    return image;
  } finally {
    revokeUrl(objectUrl);
  }
}

async function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not convert that image."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

export async function prepareCaseImage(file: File): Promise<PreparedCaseImage> {
  if (!ALLOWED_MIME_TYPES.has(file.type) || !getFileExtension(file.name)) {
    throw new Error("Upload a JPG, JPEG, PNG, or WebP image only.");
  }

  if (file.size > MAX_SOURCE_IMAGE_SIZE_BYTES) {
    throw new Error("That image is too large to safely compress in-browser. Try a smaller photo.");
  }

  const image = await loadImageFromBlob(file);
  const maxDimension = 1280;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is not supported in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.86;
  let processedBlob = await canvasToWebp(canvas, quality);

  while (processedBlob.size > MAX_IMAGE_SIZE_BYTES && quality > 0.45) {
    quality -= 0.08;
    processedBlob = await canvasToWebp(canvas, quality);
  }

  if (processedBlob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Compressed image is still above 1 MB. Try a smaller photo.");
  }

  return {
    blob: processedBlob,
    previewUrl: URL.createObjectURL(processedBlob),
  };
}

export function releasePreparedImage(preparedImage: PreparedCaseImage | null) {
  if (!preparedImage) {
    return;
  }

  revokeUrl(preparedImage.previewUrl);
}
