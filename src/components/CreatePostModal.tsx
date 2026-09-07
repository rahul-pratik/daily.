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
  PlusCircle,
  FileText,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { User, Post, Community, PostDraft } from '../types';
import { getTodayDateString, DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { CollabCollageStudio } from './CollabCollageStudio';

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

const CATEGORY_REFLECTION_PROMPTS: Record<string, string[]> = {
  Coding: [
    'Shipped new feature and fixed state sync bugs.',
    'Refactored API caching layer; cut latency in half.',
    'Closed 3 core GitHub pull requests and deployed build.',
    'Built custom UI components and tested responsiveness.',
  ],
  Fitness: [
    'Completed 45m strength training session. Felt energized!',
    'Hit personal record on deadlifts today. Good form throughout.',
    'Completed 30m core conditioning circuit. No excuses.',
    'Stretched and worked on mobility exercises after session.',
  ],
  Run: [
    'Ran 5km at 5:20 pace. Felt great on the hill climb!',
    'Morning 6-mile aerobic base run. Crisp weather.',
    'Completed 8 interval sprint repeats at the local track.',
    'Steady progression run; heart rate stayed in zone 2.',
  ],
  Reading: [
    'Read 25 pages of deep work principles. No phone notifications.',
    'Finished chapter on distributed consensus algorithms.',
    'Took detailed summary notes on productivity frameworks.',
    'Morning 30-minute reading session with black coffee.',
  ],
  Building: [
    'Completed product sprint deliverables before deadline.',
    'Interviewed 2 target users and validated our core thesis.',
    'Polished high-fidelity Figma components and design tokens.',
    'Shipped v1 MVP update to beta testers today.',
  ],
  Design: [
    'Designed 4 mobile screens with clean typographic scale.',
    'Refined dark theme color tokens and contrast ratios.',
    'Created vector iconography set for primary actions.',
  ],
  Gardening: [
    'Tended to soil, pruned vegetable rows, and watered garden beds.',
    'Planted new seasonal seedlings and checked hydroponic roots.',
    'Harvested fresh organic produce and maintained garden beds.',
  ],
  Default: [
    'Stayed disciplined and showed up for my daily standard.',
    'Focused uninterrupted for 90 minutes on the top priority.',
    'Eliminated distractions early and executed the main task.',
    'Made steady 1% compounding progress today.',
  ],
};

const REFLECTION_STARTERS = [
  'Built ',
  'Ran ',
  'Shipped ',
  'Completed ',
  'Planted ',
  'Learned ',
  'Hit daily goal: ',
];

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
  const [draftRestored, setDraftRestored] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCollageGenerated, setIsCollageGenerated] = useState(false);
  const [isCollageStudioOpen, setIsCollageStudioOpen] = useState(false);
  const [allowDraftingAfterPost, setAllowDraftingAfterPost] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        }

        if (initialContent !== undefined || initialImageUrl !== undefined || initialImageUrls !== undefined) {
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
          setDraftRestored(false);
        } else {
          // Check if there is an unsaved 'last_draft' in localStorage to prevent loss on accidental closure
          let restoredFromLastDraft = false;
          try {
            const rawLastDraft = localStorage.getItem(LAST_DRAFT_STORAGE_KEY);
            if (rawLastDraft) {
              const parsed = JSON.parse(rawLastDraft);
              const hasDraftContent = Boolean(
                parsed &&
                ((parsed.content && parsed.content.trim().length > 0) ||
                  (parsed.imageUrl && parsed.imageUrl.trim().length > 0) ||
                  (Array.isArray(parsed.imageUrls) && parsed.imageUrls.length > 0))
              );
              if (hasDraftContent) {
                setContent(parsed.content || '');
                const list = Array.isArray(parsed.imageUrls) && parsed.imageUrls.length > 0
                  ? parsed.imageUrls
                  : parsed.imageUrl
                  ? [parsed.imageUrl]
                  : [];
                setImageUrls(list);
                setImageUrl(list[0] || parsed.imageUrl || '');
                if (Array.isArray(parsed.photoCaptions)) {
                  setPhotoCaptions(parsed.photoCaptions);
                }
                if (Array.isArray(parsed.selectedTags) && parsed.selectedTags.length > 0) {
                  setSelectedTags(parsed.selectedTags);
                } else {
                  setSelectedTags(['Building']);
                }
                if (parsed.scheduledDateTime) {
                  setScheduledDateTime(parsed.scheduledDateTime);
                  setIsScheduleMode(Boolean(parsed.isScheduleMode));
                }
                if (parsed.isCollageGenerated) {
                  setIsCollageGenerated(true);
                }
                setDraftRestored(true);
                restoredFromLastDraft = true;
              }
            }
          } catch (err) {
            console.warn('Could not parse last_draft from localStorage:', err);
          }

          // If no localStorage last_draft, check stored user drafts
          if (!restoredFromLastDraft) {
            const userDrafts = DailyStorageService.getAllDrafts(currentUser.id);
            if (userDrafts.length > 0) {
              const latestDraft = userDrafts[0];
              setCurrentDraftId(latestDraft.id);
              setContent(latestDraft.content || '');
              const draftList = latestDraft.imageUrls && latestDraft.imageUrls.length > 0
                ? latestDraft.imageUrls
                : latestDraft.imageUrl
                ? [latestDraft.imageUrl]
                : [];
              setImageUrls(draftList);
              setImageUrl(draftList[0] || '');
              if (latestDraft.tags && latestDraft.tags.length > 0) {
                setSelectedTags(latestDraft.tags);
              } else {
                setSelectedTags(['Building']);
              }
              if (latestDraft.scheduledAt) {
                setScheduledDateTime(latestDraft.scheduledAt);
                setIsScheduleMode(Boolean(latestDraft.isScheduled));
              }
              setDraftRestored(true);
            } else {
              setCurrentDraftId(undefined);
              setContent('');
              setImageUrl('');
              setImageUrls([]);
              setPhotoCaptions([]);
              setSelectedTags(['Building']);
              setIsScheduleMode(false);
              setDraftRestored(false);
            }
          }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - imageUrls.length;
    if (remainingSlots <= 0) {
      showToast(`Maximum ${MAX_PHOTOS} photos already reached.`);
      return;
    }

    const filesArray = (Array.from(files) as File[]).slice(0, remainingSlots);

    Promise.all(
      filesArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              resolve('');
            }
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      })
    ).then((results) => {
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
        showToast(`Added ${validImages.length} photo${validImages.length > 1 ? 's' : ''}! (${imageUrls.length + validImages.length}/${MAX_PHOTOS})`);
      }
    });
    e.target.value = '';
  };

  const handleRemovePhotoAtIndex = (indexToRemove: number) => {
    vibrateLight();
    setImageUrls((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      setImageUrl(updated[0] || '');
      return updated;
    });
    setPhotoCaptions((prev) => prev.filter((_, i) => i !== indexToRemove));
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

  const handleAppendFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files) as File[];

    Promise.all(
      filesArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              resolve('');
            }
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      })
    ).then((results) => {
      const validImages = results.filter((img) => Boolean(img));
      if (validImages.length > 0) {
        setExtraPhotosToAppend((prev) => [...prev, ...validImages]);
        vibrateLight();
        showToast(`Selected ${validImages.length} additional receipt photo${validImages.length > 1 ? 's' : ''}!`);
      }
    });
    e.target.value = '';
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
    setDraftRestored(false);
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
    const primaryImg = imageUrls[0] || imageUrl.trim() || undefined;
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

  const handleInsertStarter = (starterText: string) => {
    vibrateLight();
    if (!content.trim()) {
      setContent(starterText);
    } else {
      setContent((prev) => `${prev.trim()} ${starterText}`);
    }
  };

  const handleApplyStitchedCollage = (stitchedDataUrl: string) => {
    setImageUrl(stitchedDataUrl);
    setIsCollageGenerated(true);
    if (!content.trim()) {
      setContent('Daily proof collage: Combined progress receipts for today’s post!');
    }
    setSelectedTags(['DailyProof', 'Collab']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (isScheduleMode) {
      handleQueueScheduledPost();
      return;
    }

    vibrateStreakMilestone();
    const primaryImg = imageUrls[0] || imageUrl.trim() || undefined;
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
    setDraftRestored(false);
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

            {/* Close */}
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

              {/* Draft Restored Banner */}
              {draftRestored && (
                <div className="flex items-center justify-between px-3 py-2 bg-[#2F6FED]/10 border border-[#2F6FED]/30 rounded-xl text-blue-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span>Restored previous draft from auto-save</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-white/60 hover:text-white underline text-[11px] font-semibold"
                  >
                    Clear draft
                  </button>
                </div>
              )}

              {/* Image Proof Upload / Preview Box */}
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
                    <button
                      type="button"
                      onClick={() => setIsCollageStudioOpen(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold lowercase hover:underline"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Collab stitch</span>
                    </button>
                  </div>
                </div>

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
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Attached Photos List with Individual Caption for each */}
                {imageUrls.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{imageUrls.length} Photo{imageUrls.length > 1 ? 's' : ''} Attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setImageUrl('');
                          setImageUrls([]);
                          setPhotoCaptions([]);
                          setIsCollageGenerated(false);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove all</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                      {imageUrls.map((img, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/15 bg-black shrink-0">
                              <img
                                src={img}
                                alt={`photo-${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 left-1 text-[8px] font-mono font-bold text-white bg-black/75 px-1 rounded">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-white/80">
                                  Photo #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhotoAtIndex(idx)}
                                  className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Remove this photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={photoCaptions[idx] || ''}
                                onChange={(e) => handleUpdatePhotoCaption(idx, e.target.value)}
                                placeholder={`Write caption for photo #${idx + 1} (optional)...`}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2F6FED]"
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
                    {isAutoSaving ? (
                      <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1" title="Persisting form state to localStorage as last_draft">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Auto-saving...
                      </span>
                    ) : lastAutoSaveTime ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1" title="Saved locally to last_draft">
                        <Check className="w-3 h-3" />
                        Auto-saved
                      </span>
                    ) : null}
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

                {/* Quick Starter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] text-white/40 shrink-0 flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" />
                    Starters:
                  </span>
                  {REFLECTION_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => handleInsertStarter(starter)}
                      className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white shrink-0 transition-colors"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag / Category Selector */}
              {/* Tag / Category Selector */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  Category Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Building',
                    'Coding',
                    'Fitness',
                    'Run',
                    'Reading',
                    'Design',
                    'Gardening',
                    'Mindset',
                    'DailyProof',
                  ].map((tag) => {
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

      {/* Collab Collage Studio Modal */}
      {isCollageStudioOpen && (
        <CollabCollageStudio
          isOpen={isCollageStudioOpen}
          currentUser={currentUser}
          todayCommunityPosts={posts}
          onClose={() => setIsCollageStudioOpen(false)}
          onApplyCollage={handleApplyStitchedCollage}
        />
      )}
    </>
  );
};
