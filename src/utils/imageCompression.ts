export const MAX_IMAGE_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_IMAGE_DATA_URL_LENGTH = 550_000;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function isSupportedImageType(type: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(type.toLowerCase());
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!isSupportedImageType(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP image.');
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error('Choose an image smaller than 15 MB.');
  }

  let decoded: DecodedImage;
  try {
    decoded = await decodeImage(file);
  } catch {
    throw new Error('This image could not be opened. Try another photo.');
  }

  try {
    if (decoded.width < 1 || decoded.height < 1) {
      throw new Error('This image has invalid dimensions. Try another photo.');
    }

    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height));
    let width = Math.max(1, Math.round(decoded.width * scale));
    let height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(decoded.source, 0, 0, width, height);

      for (const quality of [0.82, 0.68, 0.54, 0.4]) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return dataUrl;
      }

      width = Math.max(1, Math.round(width * 0.75));
      height = Math.max(1, Math.round(height * 0.75));
    }

    throw new Error('This photo could not be compressed enough to save in Firestore. Choose a smaller image.');
  } finally {
    decoded.cleanup();
  }
}
