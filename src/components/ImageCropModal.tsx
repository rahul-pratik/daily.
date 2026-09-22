import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Sparkles } from 'lucide-react';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onCropComplete,
  onCancel,
  title = 'Crop Profile Photo',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset transform when new image is loaded
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
  }, [isOpen, imageSrc]);

  // Handle Drag / Pan with mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle Touch Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    vibrateLight();
    setScale((prev) => Math.min(Math.max(0.8, prev + delta), 4));
  };

  const handleRotate = () => {
    vibrateLight();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    vibrateLight();
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Perform canvas crop
  const handleApplyCrop = () => {
    if (!imgRef.current) return;
    vibrateStreakMilestone();

    const outputSize = 512; // High resolution square
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Circular clipping mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill background neutral
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, outputSize, outputSize);

    // Apply translations & rotation relative to canvas center
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Viewport preview circle is 260px
    const previewSize = 260;
    const scaleFactor = outputSize / previewSize;

    // Position offset scaled
    ctx.translate(position.x * scaleFactor, position.y * scaleFactor);

    // Calculate aspect ratio fit inside preview
    const imgAspect = naturalSize.width / naturalSize.height;
    let baseWidth = previewSize;
    let baseHeight = previewSize;

    if (imgAspect > 1) {
      // Landscape: fit height
      baseHeight = previewSize;
      baseWidth = previewSize * imgAspect;
    } else {
      // Portrait or square: fit width
      baseWidth = previewSize;
      baseHeight = previewSize / imgAspect;
    }

    const drawW = baseWidth * scale * scaleFactor;
    const drawH = baseHeight * scale * scaleFactor;

    ctx.drawImage(imgRef.current, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Export as high quality webp/jpeg data url
    try {
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedUrl);
    } catch {
      const fallbackUrl = canvas.toDataURL('image/png');
      onCropComplete(fallbackUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="image-crop-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        id="image-crop-modal-card"
        className="relative w-full max-w-sm bg-[#121216] border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col items-center select-none overflow-hidden"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2F6FED]/20 flex items-center justify-center text-[#2F6FED]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[10px] text-white/50">Drag to center, slider to zoom</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Viewport Stage */}
        <div className="relative my-4 w-[260px] h-[260px] rounded-full overflow-hidden border-2 border-[#2F6FED] shadow-inner bg-black cursor-grab active:cursor-grabbing flex items-center justify-center ring-4 ring-[#2F6FED]/20">
          {/* Subtle grid lines inside circle */}
          <div className="absolute inset-0 pointer-events-none opacity-20 grid grid-cols-3 grid-rows-3 z-10">
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-b border-white/40" />
            <div className="border-r border-white/40" />
            <div className="border-r border-white/40" />
            <div />
          </div>

          {/* Interactive Image */}
          {imageLoaded ? (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                touchAction: 'none',
              }}
              className="w-full h-full flex items-center justify-center cursor-move"
            >
              <img
                src={imageSrc}
                alt="Crop Target"
                draggable={false}
                className="max-w-none pointer-events-none object-contain"
                style={{
                  width: naturalSize.width >= naturalSize.height ? 'auto' : '260px',
                  height: naturalSize.height > naturalSize.width ? 'auto' : '260px',
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-white/40 text-xs">
              <div className="w-6 h-6 border-2 border-[#2F6FED] border-t-transparent rounded-full animate-spin" />
              <span>Loading photo...</span>
            </div>
          )}

          {/* Drag Overlay Hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-medium text-white/70 pointer-events-none flex items-center gap-1 z-20">
            <Move className="w-2.5 h-2.5" />
            <span>Drag to adjust</span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="w-full space-y-3 px-2">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-[#2F6FED] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions (Rotate & Reset) */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRotate}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span>Rotate 90°</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="w-full grid grid-cols-2 gap-2.5 pt-4 mt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#2F6FED] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-[#2F6FED]/25 hover:shadow-[#2F6FED]/40 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
