/**
 * Client-side image compression and aspect-ratio cropping utility using HTML5 Canvas.
 * Supports:
 * - 'square' (1:1 standard feed format)
 * - '4:5' (4:5 vertical portrait feed format)
 * - 'original' (keeps original aspect ratio, scaled to max dimension)
 * 
 * Compresses raw multi-megabyte mobile photos to compact, high-clarity JPEGs (~25KB-50KB),
 * enabling all 13 photos to safely persist to localStorage and render instantly.
 */

export type AspectRatioType = 'square' | '4:5' | 'original';

export interface SquareCropOptions {
  mode?: 'fill' | 'fit'; // 'fill' = crop into 1:1, 'fit' = whole photo inside 1:1 with letterbox (Instagram style)
  zoom?: number; // 1.0 to 3.0
  panX?: number; // -1 to 1 (left to right)
  panY?: number; // -1 to 1 (top to bottom)
  bgColor?: string;
}

export const cropAndCompressImage = async (
  source: File | string,
  aspectRatio: AspectRatioType = 'square',
  maxWidth = 1000,
  quality = 0.80,
  options?: SquareCropOptions
): Promise<string> => {
  return new Promise<string>((resolve) => {
    const processImageElement = (img: HTMLImageElement) => {
      // If Instagram-style 1:1 Square options are provided or aspectRatio is square
      if (aspectRatio === 'square' || options) {
        const destSize = Math.min(maxWidth, Math.max(img.width, img.height, 600));
        const canvas = document.createElement('canvas');
        canvas.width = destSize;
        canvas.height = destSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        const mode = options?.mode || 'fill';
        const zoom = Math.max(1.0, Math.min(3.0, options?.zoom || 1.0));
        const panX = Math.max(-1.0, Math.min(1.0, options?.panX || 0));
        const panY = Math.max(-1.0, Math.min(1.0, options?.panY || 0));

        // Instagram-style background (pure deep dark or custom)
        ctx.fillStyle = options?.bgColor || '#090a0f';
        ctx.fillRect(0, 0, destSize, destSize);

        if (mode === 'fit') {
          // Fit mode: preserve whole image within the 1:1 square with clean letterboxing
          const scale = Math.min(destSize / img.width, destSize / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (destSize - drawW) / 2;
          const drawY = (destSize - drawH) / 2;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
          // Fill mode: crop to 1:1 square, applying zoom and pan according to user's wish
          const baseDim = Math.min(img.width, img.height);
          const cropDim = baseDim / zoom;

          const maxOffsetX = (img.width - cropDim) / 2;
          const maxOffsetY = (img.height - cropDim) / 2;

          let sx = (img.width - cropDim) / 2 + (panX * maxOffsetX);
          let sy = (img.height - cropDim) / 2 + (panY * maxOffsetY);

          // Clamping
          sx = Math.max(0, Math.min(img.width - cropDim, sx));
          sy = Math.max(0, Math.min(img.height - cropDim, sy));

          ctx.drawImage(img, sx, sy, cropDim, cropDim, 0, 0, destSize, destSize);
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
        return;
      }

      // Legacy fallback for non-square
      let sx = 0;
      let sy = 0;
      let sWidth = img.width;
      let sHeight = img.height;

      if (aspectRatio === '4:5') {
        const targetRatio = 4 / 5;
        const currentRatio = img.width / img.height;
        if (currentRatio > targetRatio) {
          sHeight = img.height;
          sWidth = Math.round(img.height * targetRatio);
          sx = Math.round((img.width - sWidth) / 2);
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = Math.round(img.width / targetRatio);
          sx = 0;
          sy = Math.round((img.height - sHeight) / 2);
        }
      }

      let destWidth = sWidth;
      let destHeight = sHeight;

      if (destWidth > maxWidth || destHeight > maxWidth) {
        if (destWidth >= destHeight) {
          destHeight = Math.round((destHeight * maxWidth) / destWidth);
          destWidth = maxWidth;
        } else {
          destWidth = Math.round((destWidth * maxWidth) / destHeight);
          destHeight = maxWidth;
        }
      }

      destWidth = Math.max(1, destWidth);
      destHeight = Math.max(1, destHeight);

      const canvas = document.createElement('canvas');
      canvas.width = destWidth;
      canvas.height = destHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      ctx.fillStyle = '#0f0f11';
      ctx.fillRect(0, 0, destWidth, destHeight);
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, destWidth, destHeight);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    if (typeof source === 'string') {
      const img = new Image();
      img.onload = () => processImageElement(img);
      img.onerror = () => resolve(source);
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl !== 'string') {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => processImageElement(img);
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    }
  });
};

export const compressImageFile = async (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.78
): Promise<string> => {
  return cropAndCompressImage(file, 'original', maxWidth, quality);
};
