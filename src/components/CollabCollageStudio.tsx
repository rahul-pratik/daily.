import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Layers, Image as ImageIcon, Check, RefreshCw, Upload, Grid } from 'lucide-react';
import { Post, User } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface CollabCollageStudioProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  todayCommunityPosts: Post[];
  onApplyCollage: (stitchedImageUrl: string) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  {
    title: 'Morning Run Track',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
    category: 'Run',
  },
  {
    title: 'Coding Session',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
    category: 'Code',
  },
  {
    title: 'Strength Training',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    category: 'Gym',
  },
  {
    title: 'Deep Reading',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    category: 'Read',
  },
  {
    title: 'Desk Workspace',
    url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
    category: 'Build',
  },
  {
    title: 'Garden Care',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    category: 'Plants',
  },
];

export const CollabCollageStudio: React.FC<CollabCollageStudioProps> = ({
  isOpen,
  onClose,
  currentUser,
  todayCommunityPosts,
  onApplyCollage,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<'2-split' | '3-hero' | '4-quad'>('2-split');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize with today's community posts if any exist
  useEffect(() => {
    if (isOpen) {
      const communityImages = todayCommunityPosts
        .map((p) => p.imageUrl)
        .filter((url): url is string => !!url);

      if (communityImages.length >= 2) {
        setSelectedImages(communityImages.slice(0, 4));
        if (communityImages.length === 3) setLayoutMode('3-hero');
        if (communityImages.length >= 4) setLayoutMode('4-quad');
      } else if (communityImages.length === 1) {
        setSelectedImages([communityImages[0], PRESET_SAMPLE_PHOTOS[0].url]);
        setLayoutMode('2-split');
      } else {
        setSelectedImages([PRESET_SAMPLE_PHOTOS[0].url, PRESET_SAMPLE_PHOTOS[1].url]);
        setLayoutMode('2-split');
      }
    }
  }, [isOpen, todayCommunityPosts]);

  // Redraw canvas whenever selected images or layout changes
  useEffect(() => {
    if (!isOpen || selectedImages.length < 2) return;
    renderCanvasCollage();
  }, [selectedImages, layoutMode, isOpen]);

  if (!isOpen) return null;

  const toggleImageSelection = (url: string) => {
    vibrateLight();
    if (selectedImages.includes(url)) {
      if (selectedImages.length > 2) {
        setSelectedImages(selectedImages.filter((u) => u !== url));
      }
    } else {
      if (selectedImages.length >= 4) {
        // Replace oldest
        setSelectedImages([...selectedImages.slice(1), url]);
      } else {
        setSelectedImages([...selectedImages, url]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList: File[] = Array.from(files);
      const readers = fileList.map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers).then((newUrls) => {
        vibrateLight();
        const combined = [...newUrls, ...selectedImages].slice(0, 4);
        setSelectedImages(combined);
      });
    }
  };

  const renderCanvasCollage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1000;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // Background Canvas
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, width, height);

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Fallback solid color image
          resolve(img);
        };
        img.src = src;
      });
    };

    const loadedImgs = await Promise.all(selectedImages.map((src) => loadImage(src)));
    const padding = 12;
    const gap = 12;

    const drawCropped = (
      img: HTMLImageElement,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
      radius = 16
    ) => {
      ctx.save();
      // Rounded Clip
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, radius);
      ctx.clip();

      if (img.width && img.height) {
        const imgRatio = img.width / img.height;
        const targetRatio = dw / dh;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(dx, dy, dw, dh);
      }
      ctx.restore();

      // Subtle border
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, radius);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.stroke();
      ctx.restore();
    };

    const count = loadedImgs.length;
    const bannerHeight = 80;
    const usableHeight = height - padding * 2 - bannerHeight;

    if (count === 2 || layoutMode === '2-split') {
      const halfW = (width - padding * 2 - gap) / 2;
      drawCropped(loadedImgs[0], padding, padding, halfW, usableHeight);
      drawCropped(loadedImgs[1] || loadedImgs[0], padding + halfW + gap, padding, halfW, usableHeight);
    } else if (count === 3 || layoutMode === '3-hero') {
      const halfW = (width - padding * 2 - gap) / 2;
      const halfH = (usableHeight - gap) / 2;
      drawCropped(loadedImgs[0], padding, padding, halfW, usableHeight);
      drawCropped(loadedImgs[1] || loadedImgs[0], padding + halfW + gap, padding, halfW, halfH);
      drawCropped(loadedImgs[2] || loadedImgs[0], padding + halfW + gap, padding + halfH + gap, halfW, halfH);
    } else {
      // 4-quad layout
      const halfW = (width - padding * 2 - gap) / 2;
      const halfH = (usableHeight - gap) / 2;
      drawCropped(loadedImgs[0], padding, padding, halfW, halfH);
      drawCropped(loadedImgs[1] || loadedImgs[0], padding + halfW + gap, padding, halfW, halfH);
      drawCropped(loadedImgs[2] || loadedImgs[0], padding, padding + halfH + gap, halfW, halfH);
      drawCropped(loadedImgs[3] || loadedImgs[0], padding + halfW + gap, padding + halfH + gap, halfW, halfH);
    }

    // Bottom Watermark / Collab Proof Banner
    const bannerY = height - bannerHeight - padding;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(padding, bannerY + 6, width - padding * 2, bannerHeight - 6, 16);
    ctx.fillStyle = '#121212';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2F6FED';
    ctx.stroke();

    // Banner Text
    ctx.fillStyle = '#2F6FED';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('DAILY PROOF COLLAB', padding + 24, bannerY + 44);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`@${currentUser.username} • 1 Unbroken Daily Main Proof`, padding + 24, bannerY + 68);

    // Streak badge right
    ctx.fillStyle = '#2F6FED';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🔥 STREAK ${currentUser.currentStreak}D`, width - padding - 24, bannerY + 48);
    ctx.restore();

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPreviewUrl(dataUrl);
    } catch {
      // Ignore security cors issues
    }
  };

  const handleApply = () => {
    vibrateStreakMilestone();
    if (previewUrl) {
      onApplyCollage(previewUrl);
      onClose();
    } else {
      renderCanvasCollage().then(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          onApplyCollage(canvas.toDataURL('image/jpeg', 0.92));
        }
        onClose();
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0D0D0D] border border-[#2F6FED]/40 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED] shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                Collab Photo Stitcher
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#2F6FED] text-white px-2 py-0.5 rounded-full">
                  Main Post
                </span>
              </h3>
              <p className="text-[11px] text-white/50">
                Merge multiple proofs into 1 unified photo receipt for your main post
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 no-scrollbar max-h-[58vh]">
          {/* Canvas Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#2F6FED] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Composite Preview ({selectedImages.length} Photos Selected)
              </span>

              {/* Layout Switcher */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setLayoutMode('2-split');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    layoutMode === '2-split' ? 'bg-[#2F6FED] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  2-Split
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setLayoutMode('3-hero');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    layoutMode === '3-hero' ? 'bg-[#2F6FED] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  3-Grid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setLayoutMode('4-quad');
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    layoutMode === '4-quad' ? 'bg-[#2F6FED] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  4-Quad
                </button>
              </div>
            </div>

            {/* Canvas Element */}
            <div className="w-full aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden border border-[#2F6FED]/30 bg-black flex items-center justify-center shadow-xl shadow-black">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* Today's Community Proofs (if available) */}
          {todayCommunityPosts.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
                Today's Community Uploads (Tap to include in Collab)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {todayCommunityPosts.map((post) => {
                  if (!post.imageUrl) return null;
                  const isSelected = selectedImages.includes(post.imageUrl);
                  return (
                    <div
                      key={post.id}
                      onClick={() => toggleImageSelection(post.imageUrl!)}
                      className={`relative aspect-video rounded-xl overflow-hidden border cursor-pointer group transition-all ${
                        isSelected
                          ? 'border-[#2F6FED] ring-2 ring-[#2F6FED]/50'
                          : 'border-white/10 hover:border-white/30 opacity-70'
                      }`}
                    >
                      <img
                        src={post.imageUrl}
                        alt="Community proof"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#2F6FED] text-white font-black text-[10px] flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 p-1 text-[9px] truncate text-white">
                        {post.communityName || 'Community'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Presets and Upload Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/70">
                Preset Proof Library / Upload Custom
              </span>

              <label className="cursor-pointer text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Upload Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_SAMPLE_PHOTOS.map((preset) => {
                const isSelected = selectedImages.includes(preset.url);
                return (
                  <div
                    key={preset.url}
                    onClick={() => toggleImageSelection(preset.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2F6FED] ring-2 ring-[#2F6FED]/50'
                        : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2F6FED] text-white font-black text-[8px] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-white p-0.5 text-center truncate">
                      {preset.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-3 rounded-2xl bg-[#2F6FED] hover:bg-[#E5B842] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#2F6FED]/25 transition-all min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Use Collab Photo for 1 Main Post</span>
          </button>
        </div>
      </div>
    </div>
  );
};
