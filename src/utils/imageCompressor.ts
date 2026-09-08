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

export const cropAndCompressImage = async (
  source: File | string,
  aspectRatio: AspectRatioType = 'square',
  maxWidth = 1000,
  quality = 0.80
): Promise<string> => {
  return new Promise<string>((resolve) => {
    const processImageElement = (img: HTMLImageElement) => {
      let sx = 0;
      let sy = 0;
      let sWidth = img.width;
      let sHeight = img.height;

      if (aspectRatio === 'square') {
        const minDim = Math.min(img.width, img.height);
        sWidth = minDim;
        sHeight = minDim;
        sx = Math.round((img.width - minDim) / 2);
        sy = Math.round((img.height - minDim) / 2);
      } else if (aspectRatio === '4:5') {
        const targetRatio = 4 / 5;
        const currentRatio = img.width / img.height;
        if (currentRatio > targetRatio) {
          // Too wide: crop horizontal sides
          sHeight = img.height;
          sWidth = Math.round(img.height * targetRatio);
          sx = Math.round((img.width - sWidth) / 2);
          sy = 0;
        } else {
          // Too tall: crop vertical top/bottom
          sWidth = img.width;
          sHeight = Math.round(img.width / targetRatio);
          sx = 0;
          sy = Math.round((img.height - sHeight) / 2);
        }
      }

      // Calculate output canvas dimensions
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

      // Fill neutral dark background to avoid transparent artifacts
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
