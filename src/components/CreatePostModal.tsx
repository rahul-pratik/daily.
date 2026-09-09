import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Flame,
  Upload,
  Sparkles,
  Camera,
  Check,
  CalendarCheck,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Target,
  PenTool,
  CheckCircle2,
  ShieldCheck,
  Save,
  Clock,
  RefreshCw,
  Lightbulb,
  CornerDownLeft,
  Users,
  Globe,
  Layers,
  ArrowRight,
  ArrowLeft,
  PlusCircle,
  FileText,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Crop,
  Images,
  RotateCcw,
  Maximize2,
  Minimize2,
  ZoomIn,
  Sliders,
  Square,
} from 'lucide-react';
import { User, Post, Community, PostDraft } from '../types';
import { getTodayDateString, DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { cropAndCompressImage, AspectRatioType, SquareCropOptions } from '../utils/imageCompressor';

interface CreatePostModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  posts?: Post[];
  communities?: Community[];
  initialCommunityId?: string;
  initialDraftId?: string;
  initialContent?: string;
  initialImageUrl?: string;
  initialImageUrls?: string[];
  initialTags?: string[];
  initialScheduledAt?: string;
  initialIsScheduled?: boolean;
  onSubmitPost: (payload: {
    content: string;
    imageUrl?: string;
    imageUrls?: string[];
    photoCaptions?: string[];
    tags: string[];
    isMainPost?: boolean;
    communityId?: string;
    communityName?: string;
    isCollage?: boolean;
  }) => void;
  onAppendPhotosToTodayPost?: (newImageUrls: string[]) => void;
  onViewMyPost?: (postId: string) => void;
  onDraftSaved?: (draft: PostDraft) => void;
  onPostScheduled?: (draft: PostDraft) => void;
}

const MAX_PHOTOS = 13;
const LAST_DRAFT_STORAGE_KEY = 'last_draft';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  posts = [],
  communities = [],
  initialCommunityId,
  initialDraftId,
  initialContent,
  initialImageUrl,
  initialImageUrls,
  initialTags,
  initialScheduledAt,
  initialIsScheduled,
  onSubmitPost,
  onAppendPhotosToTodayPost,
  onViewMyPost,
  onDraftSaved,
  onPostScheduled,
}) => {
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(initialDraftId);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (initialImageUrls && initialImageUrls.length > 0) return initialImageUrls;
    if (initialImageUrl) return [initialImageUrl];
    return [];
  });
  const [isAppendingPhotosToToday, setIsAppendingPhotosToToday] = useState(false);
  const [extraPhotosToAppend, setExtraPhotosToAppend] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Building']);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCollageGenerated, setIsCollageGenerated] = useState(false);
  const [allowDraftingAfterPost, setAllowDraftingAfterPost] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Aspect-ratio & photo preview state
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('square');
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [isProcessingImages, setIsProcessingImages] = useState<boolean>(false);

  // Photoshop CS6 style Crop Studio state
  const [isInstagramCropModalOpen, setIsInstagramCropModalOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1.0);
  const [cropPanX, setCropPanX] = useState(0); // -1 (left) to 1 (right)
  const [cropPanY, setCropPanY] = useState(0); // -1 (top) to 1 (bottom)

  // Scheduling State
  const [isScheduleMode, setIsScheduleMode] = useState<boolean>(initialIsScheduled || false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    if (initialScheduledAt) return initialScheduledAt;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef(false);

  const today = getTodayDateString();
  const hasPostedToday = DailyStorageService.hasUserPostedMainToday(currentUser.id);
  const todayPost = DailyStorageService.getTodayPostForUser(currentUser.id);

  // Minimum selectable date-time for scheduling (right now)
  const minDateTime = new Date().toISOString().slice(0, 16);

  // Quick preset helper
  const setPresetSchedule = (type: '1h' | '3h' | 'tomorrow_morning' | 'tomorrow_evening') => {
    vibrateLight();
    const now = new Date();
    if (type === '1h') {
      now.setHours(now.getHours() + 1);
    } else if (type === '3h') {
      now.setHours(now.getHours() + 3);
    } else if (type === 'tomorrow_morning') {
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
    } else if (type === 'tomorrow_evening') {
      now.setDate(now.getDate() + 1);
      now.setHours(18, 0, 0, 0);
    }
    const iso = now.toISOString().slice(0, 16);
    setScheduledDateTime(iso);
    setIsScheduleMode(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Initialize form state once on open
  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setAllowDraftingAfterPost(false);

        if (initialDraftId) {
          setCurrentDraftId(initialDraftId);
          const userDrafts = DailyStorageService.getAllDrafts(currentUser.id);
          const found = userDrafts.find((d) => d.id === initialDraftId);
          if (found) {
            setContent(found.content || '');
            const list = found.imageUrls && found.imageUrls.length > 0 ? found.imageUrls : (found.imageUrl ? [found.imageUrl] : []);
            setImageUrls(list);
            setImageUrl(list[0] || '');
            if (found.tags && found.tags.length > 0) setSelectedTags(found.tags);
            if (found.scheduledAt) {
              setScheduledDateTime(found.scheduledAt);
              setIsScheduleMode(Boolean(found.isScheduled));
            }
          }
        } else if (initialContent !== undefined || initialImageUrl !== undefined || initialImageUrls !== undefined) {
          setContent(initialContent || '');
          const initialList = initialImageUrls && initialImageUrls.length > 0
            ? initialImageUrls
            : initialImageUrl
            ? [initialImageUrl]
            : [];
          setImageUrls(initialList);
          setImageUrl(initialList[0] || '');
          if (initialTags && initialTags.length > 0) {
            setSelectedTags(initialTags);
          } else {
            setSelectedTags(['Building']);
          }
          if (initialScheduledAt) {
            setScheduledDateTime(initialScheduledAt);
            setIsScheduleMode(true);
          } else if (initialIsScheduled) {
            setIsScheduleMode(true);
          } else {
            setIsScheduleMode(false);
          }
        } else {
          setCurrentDraftId(undefined);
          setContent('');
          setImageUrl('');
          setImageUrls([]);
          setPhotoCaptions([]);
          setSelectedTags(['Building']);
          setIsScheduleMode(false);
        }
      }
    } else {
      hasInitializedRef.current = false;
      setToastMessage(null);
      setIsCollageGenerated(false);
    }
  }, [
    isOpen,
    currentUser.id,
    initialDraftId,
    initialContent,
    initialImageUrl,
    initialTags,
    initialScheduledAt,
    initialIsScheduled,
  ]);

  // Helper to construct current draft state payload
  const buildCurrentDraftPayload = () => ({
    content: content.trim(),
    imageUrl: imageUrl.trim() || (imageUrls[0] || undefined),
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    photoCaptions: photoCaptions.length > 0 ? photoCaptions : undefined,
    selectedTags,
    scheduledDateTime: isScheduleMode ? scheduledDateTime : undefined,
    isScheduleMode,
    isCollageGenerated,
    savedAt: Date.now(),
  });

  // Periodic auto-save mechanism that persists current form state to localStorage as 'last_draft'
  useEffect(() => {
    if (!isOpen || !hasInitializedRef.current) return;

    const periodicInterval = setInterval(() => {
      const hasAnyContent = Boolean(
        content.trim() ||
        imageUrl.trim() ||
        imageUrls.length > 0 ||
        photoCaptions.some((c) => c && c.trim())
      );
      if (hasAnyContent) {
        try {
          setIsAutoSaving(true);
          const payload = buildCurrentDraftPayload();
          localStorage.setItem(LAST_DRAFT_STORAGE_KEY, JSON.stringify(payload));
          setLastAutoSaveTime(Date.now());
        } catch (err) {
          console.warn('Periodic auto-save to localStorage failed:', err);
        } finally {
          setTimeout(() => setIsAutoSaving(false), 300);
        }
      }
    }, 2000);

    return () => clearInterval(periodicInterval);
  }, [
    isOpen,
    content,
    imageUrl,
    imageUrls,
    photoCaptions,
    selectedTags,
    isScheduleMode,
    scheduledDateTime,
    isCollageGenerated,
  ]);

  // Debounced auto-save as user types or edits photos
  useEffect(() => {
    if (!isOpen || !hasInitializedRef.current) return;
    const hasAnyContent = Boolean(content.trim() || imageUrl.trim() || imageUrls.length > 0);
    if (!hasAnyContent) return;

    setIsAutoSaving(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      // 1. Persist immediately to localStorage as 'last_draft'
      try {
        const payload = buildCurrentDraftPayload();
        localStorage.setItem(LAST_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.warn('Failed to auto-save last_draft to localStorage:', err);
      }

      // 2. Persist to storage service
      const { draft } = DailyStorageService.saveDraft(currentUser.id, {
        id: currentDraftId,
        content: content.trim(),
        imageUrl: imageUrl.trim() || (imageUrls[0] || undefined),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        tags: selectedTags,
        scheduledAt: isScheduleMode ? scheduledDateTime : undefined,
        isScheduled: isScheduleMode,
        isCollage: isCollageGenerated,
      });
      if (!currentDraftId) {
        setCurrentDraftId(draft.id);
      }
      setIsAutoSaving(false);
      setLastAutoSaveTime(Date.now());
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    isOpen,
    content,
    imageUrl,
    imageUrls,
    photoCaptions,
    selectedTags,
    isScheduleMode,
    scheduledDateTime,
    isCollageGenerated,
    currentUser.id,
    currentDraftId,
  ]);

  // Save current draft state on accidental closure or exit
  const handleSafeClose = () => {
    const hasAnyContent = Boolean(
      content.trim() ||
      imageUrl.trim() ||
      imageUrls.length > 0 ||
      photoCaptions.some((c) => c && c.trim())
    );
    if (hasAnyContent) {
      try {
        const payload = buildCurrentDraftPayload();
        localStorage.setItem(LAST_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.warn('Failed to persist last_draft on close:', err);
      }

      const { draft } = DailyStorageService.saveDraft(currentUser.id, {
        id: currentDraftId,
        content: content.trim(),
        imageUrl: imageUrl.trim() || (imageUrls[0] || undefined),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        tags: selectedTags,
        scheduledAt: isScheduleMode ? scheduledDateTime : undefined,
        isScheduled: isScheduleMode,
        isCollage: isCollageGenerated,
      });
      window.dispatchEvent(new CustomEvent('daily:draft-saved', { detail: { draft } }));
    }
    onClose();
  };

  // Prevent accidental loss when page is refreshed or closed while drafting
  useEffect(() => {
    if (!isOpen) return;
    const handleBeforeUnload = () => {
      const hasAnyContent = Boolean(
        content.trim() ||
        imageUrl.trim() ||
        imageUrls.length > 0 ||
        photoCaptions.some((c) => c && c.trim())
      );
      if (hasAnyContent) {
        try {
          const payload = buildCurrentDraftPayload();
          localStorage.setItem(LAST_DRAFT_STORAGE_KEY, JSON.stringify(payload));
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    isOpen,
    content,
    imageUrl,
    imageUrls,
    photoCaptions,
    selectedTags,
    isScheduleMode,
    scheduledDateTime,
    isCollageGenerated,
  ]);

  // Escape key handler for auto-saving draft on close (hook must be called unconditionally before early return)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, content, imageUrl, imageUrls, photoCaptions, selectedTags, isScheduleMode, scheduledDateTime, isCollageGenerated, currentUser.id, currentDraftId]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    vibrateLight();
    if (selectedTags.includes(tag)) {
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
    } else {
      if (selectedTags.length < 4) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - imageUrls.length;
    if (remainingSlots <= 0) {
      showToast(`Maximum ${MAX_PHOTOS} photos already reached.`);
      return;
    }

    const filesArray = (Array.from(files) as File[]).slice(0, remainingSlots);
    setIsProcessingImages(true);
    showToast(`Optimizing & formatting ${filesArray.length} photo${filesArray.length > 1 ? 's' : ''} to feed format...`);

    try {
      const results = await Promise.all(
        filesArray.map((file) => cropAndCompressImage(file, aspectRatio))
      );
      const validImages = results.filter((img) => Boolean(img));
      if (validImages.length > 0) {
        setImageUrls((prev) => {
          const combined = [...prev, ...validImages];
          setImageUrl(combined[0] || '');
          return combined;
        });
        setPhotoCaptions((prev) => {
          const updated = [...prev];
          while (updated.length < imageUrls.length + validImages.length) {
            updated.push('');
          }
          return updated;
        });
        setIsCollageGenerated(false);
        vibrateLight();
        showToast(
          `Added ${validImages.length} photo${validImages.length > 1 ? 's' : ''} formatted for feed! (${imageUrls.length + validImages.length}/${MAX_PHOTOS})`
        );
      }
    } catch (err) {
      console.error('Error processing photos:', err);
      showToast('Error formatting photos. Please try again.');
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleApplyInstagramCrop = async (targetIdx?: number) => {
    const idx = targetIdx !== undefined ? targetIdx : activePreviewIdx;
    if (!imageUrls[idx]) return;
    setIsProcessingImages(true);
    vibrateLight();
    try {
      const cropped = await cropAndCompressImage(
        imageUrls[idx],
        'square',
        1000,
        0.80,
        {
          mode: 'fill',
          zoom: cropZoom,
          panX: cropPanX,
          panY: cropPanY,
        }
      );
      setImageUrls((prev) => {
        const copy = [...prev];
        copy[idx] = cropped;
        if (idx === coverIndex) {
          setImageUrl(cropped);
        }
        return copy;
      });
      setIsInstagramCropModalOpen(false);
      showToast(`Crop applied to Photo #${idx + 1}! ✓`);
    } catch (err) {
      console.error('Failed to apply crop:', err);
      showToast('Failed to apply crop.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemovePhotoAtIndex = (indexToRemove: number) => {
    vibrateLight();
    setImageUrls((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      setImageUrl(updated[0] || '');
      return updated;
    });
    setPhotoCaptions((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (activePreviewIdx >= indexToRemove && activePreviewIdx > 0) {
      setActivePreviewIdx((prev) => prev - 1);
    }
    if (coverIndex === indexToRemove) {
      setCoverIndex(0);
    } else if (coverIndex > indexToRemove) {
      setCoverIndex((prev) => Math.max(0, prev - 1));
    }
    if (imageUrls.length <= 1) {
      setIsCollageGenerated(false);
    }
  };

  const handleUpdatePhotoCaption = (idx: number, caption: string) => {
    setPhotoCaptions((prev) => {
      const copy = [...prev];
      while (copy.length <= idx) {
        copy.push('');
      }
      copy[idx] = caption;
      return copy;
    });
  };

  const handleAppendFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files) as File[];
    setIsProcessingImages(true);
    try {
      const results = await Promise.all(
        filesArray.map((file) => cropAndCompressImage(file, aspectRatio))
      );
      const validImages = results.filter((img) => Boolean(img));
      if (validImages.length > 0) {
        setExtraPhotosToAppend((prev) => [...prev, ...validImages]);
        vibrateLight();
        showToast(`Selected ${validImages.length} additional formatted photo${validImages.length > 1 ? 's' : ''}!`);
      }
    } catch (err) {
      console.error('Error processing append photos:', err);
    } finally {
      setIsProcessingImages(false);
      e.target.value = '';
    }
  };

  const handleConfirmAppendPhotos = () => {
    if (extraPhotosToAppend.length === 0) return;
    vibrateStreakMilestone();
    if (onAppendPhotosToTodayPost) {
      onAppendPhotosToTodayPost(extraPhotosToAppend);
    } else {
      DailyStorageService.appendPhotosToTodayPost(currentUser.id, extraPhotosToAppend);
    }
    showToast(`Appended ${extraPhotosToAppend.length} photo${extraPhotosToAppend.length > 1 ? 's' : ''} to today's post! ✓ (Zero spam)`);
    setExtraPhotosToAppend([]);
    setIsAppendingPhotosToToday(false);
    onClose();
  };

  const handleDiscardDraft = () => {
    vibrateLight();
    try {
      localStorage.removeItem(LAST_DRAFT_STORAGE_KEY);
    } catch {}
    if (currentDraftId) {
      DailyStorageService.deleteDraft(currentUser.id, currentDraftId);
    }
    setCurrentDraftId(undefined);
    setContent('');
    setImageUrl('');
    setImageUrls([]);
    setPhotoCaptions([]);
    setSelectedTags(['Building']);
    setIsCollageGenerated(false);
    setIsScheduleMode(false);
    showToast('Draft cleared');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Explicitly save current draft to user's saved drafts collection
  const handleExplicitSaveDraft = () => {
    if (!content.trim() && !imageUrl.trim() && imageUrls.length === 0) {
      showToast('Add some text or a photo to save draft');
      return;
    }
    vibrateLight();
    const primaryImg = imageUrls[0] || imageUrl.trim() || undefined;
    const { draft } = DailyStorageService.saveDraft(currentUser.id, {
      id: currentDraftId,
      content: content.trim(),
      imageUrl: primaryImg,
      imageUrls: imageUrls.length > 0 ? imageUrls : (primaryImg ? [primaryImg] : undefined),
      tags: selectedTags,
      scheduledAt: isScheduleMode ? scheduledDateTime : undefined,
      isScheduled: isScheduleMode,
      isCollage: isCollageGenerated,
    });
    setCurrentDraftId(draft.id);
    if (onDraftSaved) {
      onDraftSaved(draft);
    }
    showToast('Draft saved to Profile! ✓');
  };

  // Handle scheduling submission
  const handleQueueScheduledPost = () => {
    if (!content.trim()) {
      showToast('Please add text content to schedule');
      return;
    }
    vibrateStreakMilestone();
    const primaryImg = imageUrls[coverIndex] || imageUrls[0] || imageUrl.trim() || undefined;
    const { draft } = DailyStorageService.saveDraft(currentUser.id, {
      id: currentDraftId,
      content: content.trim(),
      imageUrl: primaryImg,
      imageUrls: imageUrls.length > 0 ? imageUrls : (primaryImg ? [primaryImg] : undefined),
      tags: selectedTags,
      scheduledAt: scheduledDateTime,
      isScheduled: true,
      isCollage: isCollageGenerated,
    });

    if (onPostScheduled) {
      onPostScheduled(draft);
    }

    try {
      localStorage.removeItem(LAST_DRAFT_STORAGE_KEY);
    } catch {}

    const formattedTime = new Date(scheduledDateTime).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    showToast(`Post scheduled for ${formattedTime}! ✓`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (isScheduleMode) {
      handleQueueScheduledPost();
      return;
    }

    vibrateStreakMilestone();
    const primaryImg = imageUrls[coverIndex] || imageUrls[0] || imageUrl.trim() || undefined;
    onSubmitPost({
      content: content.trim(),
      imageUrl: primaryImg,
      imageUrls: imageUrls.length > 0 ? imageUrls : (primaryImg ? [primaryImg] : undefined),
      photoCaptions: photoCaptions.some((c) => c && c.trim()) ? photoCaptions : undefined,
      tags: selectedTags.length > 0 ? selectedTags : ['DailyProof'],
      isMainPost: true,
      isCollage: isCollageGenerated,
    });

    if (currentDraftId) {
      DailyStorageService.deleteDraft(currentUser.id, currentDraftId);
    }

    try {
      localStorage.removeItem(LAST_DRAFT_STORAGE_KEY);
    } catch {}

    setContent('');
    setImageUrl('');
    setImageUrls([]);
    setPhotoCaptions([]);
    setSelectedTags(['Building']);
    setIsCollageGenerated(false);
    onClose();
  };

  const formattedScheduledPreview = new Date(scheduledDateTime).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <>
      <div
        id="create-proof-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        onClick={handleSafeClose}
      >
        <div
          className="w-full max-w-lg bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  Post Daily Proof
                </h3>
                <p className="text-[10px] text-white/50">1 Post / Day • Streak & Receipts</p>
              </div>
            </div>

            {/* Close button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSafeClose}
                className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ACTIVE POST CREATOR */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1">

              {/* Image Proof Upload / Cropping Preview / Thumbnail Manager */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span>Attach Photos (Up to 13)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                      {imageUrls.length} / {MAX_PHOTOS}
                    </span>
                  </div>
                </div>

                {/* Active Photo Preview Card (Shown when photos are attached) */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2.5 rounded-2xl bg-black/40 border border-white/15 p-3">
                    {/* Image Preview Frame */}
                    <div className="relative w-full max-h-[360px] aspect-square mx-auto rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/15 shadow-inner">
                      <div className="w-full h-full flex items-center justify-center overflow-hidden">
                        <img
                          src={imageUrls[activePreviewIdx] || imageUrls[0]}
                          alt={`Preview photo ${activePreviewIdx + 1}`}
                          className="w-full h-full object-cover transition-all duration-150"
                        />
                      </div>

                      {/* Header Badge: Photo index and Cover Indicator */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                        <span className="px-2 py-0.5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono font-bold text-white">
                          Photo {activePreviewIdx + 1} of {imageUrls.length}
                        </span>
                        {activePreviewIdx === coverIndex ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300 text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
                            ★ Cover Photo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              vibrateLight();
                              setCoverIndex(activePreviewIdx);
                              showToast(`Photo #${activePreviewIdx + 1} set as proofs cover!`);
                            }}
                            className="px-2 py-0.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white/90 hover:text-white text-[10px] font-bold backdrop-blur-md transition-all flex items-center gap-1"
                            title="Set this photo as the cover for the proofs section"
                          >
                            Set as cover
                          </button>
                        )}
                      </div>

                      {/* Top-Right: Direct Crop Button */}
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            setIsInstagramCropModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                          title="Open photo cropper"
                        >
                          <Crop className="w-3.5 h-3.5 text-[#2F6FED]" />
                          <span>Crop</span>
                        </button>
                      </div>

                      {/* Bottom-Right Control: Multi-Photo Indicator */}
                      {imageUrls.length > 1 && (
                        <div className="absolute bottom-3 right-3 z-20">
                          <button
                            type="button"
                            onClick={() => {
                              vibrateLight();
                              setActivePreviewIdx((prev) => (prev + 1) % imageUrls.length);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold hover:bg-black/90 transition-all"
                            title="Cycle to next photo"
                          >
                            <Layers className="w-3 h-3 text-[#2F6FED]" />
                            <span>{activePreviewIdx + 1}/{imageUrls.length}</span>
                          </button>
                        </div>
                      )}

                      {/* Arrows if multiple photos */}
                      {imageUrls.length > 1 && (
                        <>
                          {activePreviewIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => setActivePreviewIdx((prev) => Math.max(0, prev - 1))}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all shadow-md z-20"
                              title="Previous photo"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          {activePreviewIdx < imageUrls.length - 1 && (
                            <button
                              type="button"
                              onClick={() => setActivePreviewIdx((prev) => Math.min(imageUrls.length - 1, prev + 1))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all shadow-md z-20"
                              title="Next photo"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload & Camera Buttons (Visible if less than MAX_PHOTOS) */}
                {imageUrls.length < MAX_PHOTOS && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="border-2 border-dashed border-white/15 hover:border-[#2F6FED]/60 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:text-[#2F6FED] group-hover:scale-110 transition-all">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                        Upload Photos
                      </span>
                      <span className="text-[10px] text-white/40">
                        {imageUrls.length === 0 ? 'Select up to 13 photos' : `Add up to ${MAX_PHOTOS - imageUrls.length} more`}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isProcessingImages}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="border-2 border-dashed border-white/15 hover:border-blue-500/60 rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:text-blue-400 group-hover:scale-110 transition-all">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                        Take Photo
                      </span>
                      <span className="text-[10px] text-white/40">Camera capture</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        disabled={isProcessingImages}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Thumbnail Preview of Selected 13 Photos with Individual Captions Visible */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{imageUrls.length} Photo{imageUrls.length > 1 ? 's' : ''} Ready for Feed</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setImageUrl('');
                          setImageUrls([]);
                          setPhotoCaptions([]);
                          setIsCollageGenerated(false);
                          setActivePreviewIdx(0);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove all</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                      {imageUrls.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            vibrateLight();
                            setActivePreviewIdx(idx);
                          }}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            activePreviewIdx === idx
                              ? 'bg-[#2F6FED]/10 border-[#2F6FED]/60 shadow-md ring-1 ring-[#2F6FED]/30'
                              : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Thumbnail Preview */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/15 bg-black shrink-0 group/thumb">
                              <img
                                src={img}
                                alt={`photo-${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 left-1 text-[8px] font-mono font-bold text-white bg-black/80 px-1 py-0.2 rounded">
                                #{idx + 1}
                              </span>
                              {activePreviewIdx === idx && (
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#2F6FED] ring-2 ring-white" />
                              )}

                              {/* Hover & Mobile Crop button directly on the thumbnail */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  vibrateLight();
                                  setActivePreviewIdx(idx);
                                  setIsInstagramCropModalOpen(true);
                                }}
                                className="absolute inset-x-0 bottom-0 bg-black/85 hover:bg-[#2F6FED] text-white text-[9px] font-bold py-1 flex items-center justify-center gap-1 transition-all z-10"
                                title="Crop photo"
                              >
                                <Crop className="w-2.5 h-2.5" />
                                <span>Crop</span>
                              </button>
                            </div>

                            {/* Individual Caption & Controls */}
                            <div className="flex-1 min-w-0 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-white/90">
                                    Photo #{idx + 1}
                                  </span>
                                  {idx === coverIndex ? (
                                    <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40 flex items-center gap-1">
                                      ★ Cover
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        vibrateLight();
                                        setCoverIndex(idx);
                                        showToast(`Photo #${idx + 1} set as proofs cover!`);
                                      }}
                                      className="text-[9px] font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-0.5 rounded border border-white/10 transition-colors"
                                      title="Use this photo as the cover in proofs section"
                                    >
                                      Use as cover
                                    </button>
                                  )}
                                  {photoCaptions[idx]?.trim() && (
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      Captioned
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {/* Crop Button on Thumbnail */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      vibrateLight();
                                      setActivePreviewIdx(idx);
                                      setIsInstagramCropModalOpen(true);
                                    }}
                                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-blue-200 bg-[#2F6FED]/20 hover:bg-[#2F6FED]/35 border border-[#2F6FED]/40 hover:text-white transition-colors flex items-center gap-1"
                                    title="Open cropper for this photo"
                                  >
                                    <Crop className="w-3 h-3 text-[#2F6FED]" />
                                    <span>Crop</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhotoAtIndex(idx)}
                                    className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Remove this photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <input
                                type="text"
                                value={photoCaptions[idx] || ''}
                                onChange={(e) => handleUpdatePhotoCaption(idx, e.target.value)}
                                placeholder={`Caption for photo #${idx + 1} (visible in home feed)...`}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2F6FED] transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reflection / Takeaways Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span>Reflection & Main Caption</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">{content.length} chars</span>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe what you executed today, lessons learned, or code shipped..."
                    rows={4}
                    className="w-full bg-[#141414] border border-white/15 focus:border-[#2F6FED] rounded-2xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Tag / Category Selector */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  Category Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Set([
                      ...(currentUser.interests || []),
                      ...(currentUser.habits || []),
                      'Building',
                      'Coding',
                      'AI',
                      'Startups',
                      'Fitness',
                      'Run',
                      'Reading',
                      'Design',
                      'Gardening',
                      'Mindset',
                      'DailyProof',
                    ])
                  ).map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all min-h-[32px] flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#2F6FED] text-white shadow-sm shadow-[#2F6FED]/30'
                            : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>#{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================== */}
              {/* SCHEDULE POST SECTION */}
              {/* ========================================== */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${isScheduleMode ? 'text-[#2F6FED]' : 'text-white/50'}`} />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Schedule Post for Later
                      </span>
                      <span className="text-[10px] text-white/50 block">
                        Queue post to automatically publish at a future time
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setIsScheduleMode(!isScheduleMode);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isScheduleMode ? 'bg-[#2F6FED]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                        isScheduleMode ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                      }`}
                    />
                  </button>
                </div>

                {isScheduleMode && (
                  <div className="space-y-2.5 pt-2 border-t border-white/10 animate-in fade-in duration-200">
                    {/* Quick Presets */}
                    <div>
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                        Quick Timing Presets:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPresetSchedule('1h')}
                          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white text-center transition-colors"
                        >
                          +1 Hour
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule('3h')}
                          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white text-center transition-colors"
                        >
                          +3 Hours
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule('tomorrow_morning')}
                          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-[#2F6FED] hover:bg-[#2F6FED]/10 text-center transition-colors"
                        >
                          Tomorrow 9 AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetSchedule('tomorrow_evening')}
                          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-blue-400 hover:bg-blue-500/10 text-center transition-colors"
                        >
                          Tomorrow 6 PM
                        </button>
                      </div>
                    </div>

                    {/* Datetime Local Picker */}
                    <div>
                      <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-1 flex items-center justify-between">
                        <span>Select Date & Time</span>
                        <span className="text-[#2F6FED] font-normal normal-case">
                          {formattedScheduledPreview}
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        min={minDateTime}
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full bg-[#141414] border border-white/15 focus:border-[#2F6FED] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toast Notification Banner */}
              {toastMessage && (
                <div className="p-2.5 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 text-xs font-bold text-[#2F6FED] flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{toastMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    className="text-white/60 hover:text-white text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs transition-colors border border-white/10 flex items-center justify-center gap-1.5 min-h-[42px]"
                    title="Clear inputs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExplicitSaveDraft}
                    className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#2F6FED] font-bold text-xs transition-colors border border-[#2F6FED]/30 flex items-center justify-center gap-1.5 min-h-[42px]"
                    title="Save to your drafts collection"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                </div>

                {isScheduleMode ? (
                  <button
                    type="button"
                    onClick={handleQueueScheduledPost}
                    disabled={!content.trim()}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px] ${
                      content.trim()
                        ? 'bg-[#2F6FED] hover:bg-[#2861d6] text-white shadow-[#2F6FED]/20 hover:scale-[1.01]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                    <span>Queue Scheduled Post</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px] ${
                      content.trim()
                        ? 'bg-[#2F6FED] hover:bg-[#2861d6] text-white shadow-[#2F6FED]/20 hover:scale-[1.01]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Post Daily Proof</span>
                  </button>
                )}
              </div>
            </form>
        </div>
      </div>

      {/* Crop Modal */}
      {isInstagramCropModalOpen && imageUrls[activePreviewIdx] && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col justify-between animate-in fade-in duration-200">
          {/* Top Navigation Bar: [← Back]  [Crop]  [Apply (Blue)] */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121216]">
            <button
              type="button"
              onClick={() => setIsInstagramCropModalOpen(false)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
              aria-label="Back to post"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                <Crop className="w-4 h-4 text-[#2F6FED]" />
                <span>Crop</span>
                {imageUrls.length > 1 && (
                  <span className="text-xs text-white/50 font-normal font-mono">
                    ({activePreviewIdx + 1}/{imageUrls.length})
                  </span>
                )}
              </h3>
            </div>

            <button
              type="button"
              id="apply-crop-btn"
              onClick={() => handleApplyInstagramCrop(activePreviewIdx)}
              disabled={isProcessingImages}
              className="px-4 py-1.5 rounded-lg bg-[#2F6FED] hover:bg-blue-600 text-white font-black text-xs tracking-wider transition-all shadow-md shadow-[#2F6FED]/30 disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Apply</span>
            </button>
          </div>

          {/* Photoshop CS6 Style Cropping Viewport */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-[#18181c] overflow-hidden">
            <div className="relative w-full max-w-[440px] aspect-square bg-[#0e0e11] rounded-xl overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center select-none">
              {/* Photo Image inside viewport */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                <img
                  src={imageUrls[activePreviewIdx]}
                  alt="Crop active photo"
                  className="select-none pointer-events-none w-full h-full object-cover transition-transform duration-100 ease-out"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropPanX * 16}%, ${cropPanY * 16}%)`,
                  }}
                />
              </div>

              {/* Photoshop CS6 Crop Frame with 55% outer shield */}
              <div className="absolute inset-4 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] border border-white/90">
                {/* Photoshop CS6 Fine Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border-r border-b border-white/20" />
                  ))}
                </div>

                {/* Photoshop CS6 Center Crosshair Pivot (+) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <div className="absolute w-[1.5px] h-4 bg-white shadow-sm" />
                    <div className="absolute h-[1.5px] w-4 bg-white shadow-sm" />
                    <div className="w-1.5 h-1.5 rounded-full border border-white shadow-sm" />
                  </div>
                </div>

                {/* Photoshop CS6 Corner L-Handles */}
                <div className="absolute -top-[2px] -left-[2px] w-4 h-4 border-t-[3.5px] border-l-[3.5px] border-white z-30 pointer-events-none shadow-md" />
                <div className="absolute -top-[2px] -right-[2px] w-4 h-4 border-t-[3.5px] border-r-[3.5px] border-white z-30 pointer-events-none shadow-md" />
                <div className="absolute -bottom-[2px] -left-[2px] w-4 h-4 border-b-[3.5px] border-l-[3.5px] border-white z-30 pointer-events-none shadow-md" />
                <div className="absolute -bottom-[2px] -right-[2px] w-4 h-4 border-b-[3.5px] border-r-[3.5px] border-white z-30 pointer-events-none shadow-md" />

                {/* Photoshop CS6 Center Edge Handles */}
                <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-4 h-[3.5px] bg-white z-30 pointer-events-none shadow-md" />
                <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-4 h-[3.5px] bg-white z-30 pointer-events-none shadow-md" />
                <div className="absolute top-1/2 -left-[2px] -translate-y-1/2 h-4 w-[3.5px] bg-white z-30 pointer-events-none shadow-md" />
                <div className="absolute top-1/2 -right-[2px] -translate-y-1/2 h-4 w-[3.5px] bg-white z-30 pointer-events-none shadow-md" />
              </div>

              {/* Multi-Photo Indicator */}
              {imageUrls.length > 1 && (
                <div className="absolute bottom-3 right-3 z-30">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-bold">
                    <Layers className="w-3 h-3 text-[#2F6FED]" />
                    <span>{activePreviewIdx + 1}/{imageUrls.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls / Adjustments & Thumbnail Strip */}
          <div className="p-4 bg-[#121216] border-t border-white/10 space-y-3.5">
            {/* Zoom & Pan Sliders */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
              {/* Zoom Slider with Presets */}
              <div className="flex items-center justify-between text-xs text-white/80">
                <span className="font-bold">Zoom: {cropZoom.toFixed(2)}x</span>
                <div className="flex items-center gap-1">
                  {[1.0, 1.25, 1.5, 2.0].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setCropZoom(z)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        Math.abs(cropZoom - z) < 0.05
                          ? 'bg-[#2F6FED] text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {z}x
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCropZoom(1.0);
                      setCropPanX(0);
                      setCropPanY(0);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 hover:text-white hover:bg-white/20 ml-1 transition-colors"
                    title="Reset zoom and center photo"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="w-full accent-[#2F6FED]"
              />

              {/* Pan X and Pan Y Controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-white/60 mb-1 font-medium">
                    <span>Horizontal Pan</span>
                    <span>{cropPanX < -0.1 ? 'Left' : cropPanX > 0.1 ? 'Right' : 'Center'}</span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={cropPanX}
                    onChange={(e) => setCropPanX(parseFloat(e.target.value))}
                    className="w-full accent-[#2F6FED]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-white/60 mb-1 font-medium">
                    <span>Vertical Pan</span>
                    <span>{cropPanY < -0.1 ? 'Top' : cropPanY > 0.1 ? 'Bottom' : 'Center'}</span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={cropPanY}
                    onChange={(e) => setCropPanY(parseFloat(e.target.value))}
                    className="w-full accent-[#2F6FED]"
                  />
                </div>
              </div>
            </div>

            {/* Photo Thumbnail Strip if multiple photos */}
            {imageUrls.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePreviewIdx(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activePreviewIdx === idx
                        ? 'border-[#2F6FED] scale-105 shadow-md shadow-[#2F6FED]/40'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 px-1 text-[8px] font-mono font-bold text-white rounded">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Apply Action Button */}
            <div className="pt-1">
              <button
                type="button"
                id="apply-crop-bottom-btn"
                onClick={() => handleApplyInstagramCrop(activePreviewIdx)}
                disabled={isProcessingImages}
                className="w-full py-2.5 rounded-xl bg-[#2F6FED] hover:bg-blue-600 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#2F6FED]/30 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
