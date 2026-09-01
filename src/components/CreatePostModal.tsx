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
  initialTags?: string[];
  initialScheduledAt?: string;
  initialIsScheduled?: boolean;
  onSubmitPost: (payload: {
    content: string;
    imageUrl?: string;
    tags: string[];
    isMainPost?: boolean;
    communityId?: string;
    communityName?: string;
    isCollage?: boolean;
  }) => void;
  onViewMyPost?: (postId: string) => void;
  onDraftSaved?: (draft: PostDraft) => void;
  onPostScheduled?: (draft: PostDraft) => void;
}

const PROOF_PHOTO_PRESETS = [
  {
    name: 'Laptop / Code',
    category: 'Coding',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gym / Fitness',
    category: 'Fitness',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Book / Reading',
    category: 'Reading',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Desk Setup',
    category: 'Building',
    url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Running Track',
    category: 'Run',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Garden / Plants',
    category: 'Gardening',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80',
  },
];

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
  initialTags,
  initialScheduledAt,
  initialIsScheduled,
  onSubmitPost,
  onViewMyPost,
  onDraftSaved,
  onPostScheduled,
}) => {
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(initialDraftId);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Building']);
  const [showPresets, setShowPresets] = useState(false);
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

        if (initialContent !== undefined || initialImageUrl !== undefined) {
          setContent(initialContent || '');
          setImageUrl(initialImageUrl || '');
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
          // Check if there are saved drafts
          const userDrafts = DailyStorageService.getAllDrafts(currentUser.id);
          if (userDrafts.length > 0) {
            const latestDraft = userDrafts[0];
            setCurrentDraftId(latestDraft.id);
            setContent(latestDraft.content || '');
            setImageUrl(latestDraft.imageUrl || '');
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
            setSelectedTags(['Building']);
            setIsScheduleMode(false);
            setDraftRestored(false);
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

  // Debounced auto-save as user types
  useEffect(() => {
    if (!isOpen || !hasInitializedRef.current) return;
    const hasAnyContent = Boolean(content.trim() || imageUrl.trim());
    if (!hasAnyContent) return;

    setIsAutoSaving(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const { draft } = DailyStorageService.saveDraft(currentUser.id, {
        id: currentDraftId,
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
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
    selectedTags,
    isScheduleMode,
    scheduledDateTime,
    isCollageGenerated,
    currentUser.id,
    currentDraftId,
  ]);

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
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setShowPresets(false);
          setIsCollageGenerated(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiscardDraft = () => {
    vibrateLight();
    if (currentDraftId) {
      DailyStorageService.deleteDraft(currentUser.id, currentDraftId);
    }
    setCurrentDraftId(undefined);
    setContent('');
    setImageUrl('');
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
    if (!content.trim() && !imageUrl.trim()) {
      showToast('Add some text or a photo to save draft');
      return;
    }
    vibrateLight();
    const { draft } = DailyStorageService.saveDraft(currentUser.id, {
      id: currentDraftId,
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
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
    const { draft } = DailyStorageService.saveDraft(currentUser.id, {
      id: currentDraftId,
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      tags: selectedTags,
      scheduledAt: scheduledDateTime,
      isScheduled: true,
      isCollage: isCollageGenerated,
    });

    if (onPostScheduled) {
      onPostScheduled(draft);
    }

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

  const handleSafeClose = () => {
    if (content.trim() || imageUrl.trim()) {
      DailyStorageService.saveDraft(currentUser.id, {
        id: currentDraftId,
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        tags: selectedTags,
        scheduledAt: isScheduleMode ? scheduledDateTime : undefined,
        isScheduled: isScheduleMode,
        isCollage: isCollageGenerated,
      });
    }
    onClose();
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
    setShowPresets(false);
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

    if (hasPostedToday) {
      return;
    }

    vibrateStreakMilestone();
    onSubmitPost({
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : ['DailyProof'],
      isMainPost: true,
      isCollage: isCollageGenerated,
    });

    if (currentDraftId) {
      DailyStorageService.deleteDraft(currentUser.id, currentDraftId);
    }

    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setShowPresets(false);
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

            {/* Close & Streak Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
                <Flame className="w-3.5 h-3.5 fill-[#D4AF37]" />
                <span>{currentUser.currentStreak}d Streak</span>
              </div>
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

          {/* If already posted today AND not currently drafting */}
          {hasPostedToday && !allowDraftingAfterPost ? (
            <div className="py-8 px-2 flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg">
                <CalendarCheck className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h4 className="text-base sm:text-lg font-black text-white">
                  You have already posted for today!
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Your daily proof is locked in and your streak is protected. Standard posts are limited to 1 per day.
                </p>
              </div>

              <div className="w-full pt-2 space-y-2.5">
                {todayPost && onViewMyPost && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewMyPost(todayPost.id);
                      onClose();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Today’s Post</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setAllowDraftingAfterPost(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  <span>Draft Notes for Tomorrow</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE POST CREATOR / DRAFTER */
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1">
              {hasPostedToday && allowDraftingAfterPost && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-300">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Drafting for tomorrow (auto-saved)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowDraftingAfterPost(false)}
                    className="text-[11px] underline text-blue-300 hover:text-white"
                  >
                    Back
                  </button>
                </div>
              )}

              {/* Draft Restored Banner */}
              {draftRestored && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>Restored previous draft</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-white/60 hover:text-white underline text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Image Proof Upload / Preview Box */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Photo Proof Receipt</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCollageStudioOpen(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold lowercase hover:underline"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Collab stitch</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 font-bold lowercase"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {showPresets ? 'hide samples' : 'sample presets'}
                    </button>
                  </div>
                </label>

                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 group bg-black/40 aspect-video max-h-48 w-full flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Proof preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setImageUrl('');
                          setIsCollageGenerated(false);
                        }}
                        className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-all transform hover:scale-105"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {isCollageGenerated && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Stitched Collage</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:text-[#D4AF37] group-hover:scale-110 transition-all">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                        Upload Photo
                      </span>
                      <span className="text-[10px] text-white/40">From files / photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center group">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:text-blue-400 group-hover:scale-110 transition-all">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                        Take Photo
                      </span>
                      <span className="text-[10px] text-white/40">Live snapshot</span>
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

                {/* Presets Grid */}
                {showPresets && !imageUrl && (
                  <div className="mt-2 p-2.5 bg-black/40 border border-white/10 rounded-2xl animate-in fade-in duration-200">
                    <p className="text-[10px] text-white/50 font-bold mb-2 uppercase tracking-wider">
                      Tap a quick preset receipt:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {PROOF_PHOTO_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            setImageUrl(preset.url);
                            setShowPresets(false);
                            if (!selectedTags.includes(preset.category)) {
                              setSelectedTags([preset.category, ...selectedTags.slice(0, 2)]);
                            }
                          }}
                          className="relative rounded-xl overflow-hidden border border-white/10 aspect-video group text-left hover:border-[#D4AF37] transition-all"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all"
                          />
                          <span className="absolute bottom-1 left-1.5 text-[9px] font-black text-white bg-black/70 px-1 py-0.5 rounded backdrop-blur-sm">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reflection / Takeaways Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Daily Reflection & Standard</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {isAutoSaving ? (
                      <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Auto-saving...
                      </span>
                    ) : lastAutoSaveTime ? (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
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
                    className="w-full bg-[#141414] border border-white/15 focus:border-[#D4AF37] rounded-2xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors resize-none leading-relaxed"
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
                            ? 'bg-[#D4AF37] text-black shadow-sm shadow-[#D4AF37]/30'
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
                    <Clock className={`w-4 h-4 ${isScheduleMode ? 'text-[#D4AF37]' : 'text-white/50'}`} />
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
                      isScheduleMode ? 'bg-[#D4AF37]' : 'bg-white/20'
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
                          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 text-center transition-colors"
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
                        <span className="text-[#D4AF37] font-normal normal-case">
                          {formattedScheduledPreview}
                        </span>
                      </label>
                      <input
                        type="datetime-local"
                        min={minDateTime}
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="w-full bg-[#141414] border border-white/15 focus:border-[#D4AF37] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toast Notification Banner */}
              {toastMessage && (
                <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] flex items-center justify-between animate-in fade-in duration-200">
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
                    className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#D4AF37] font-bold text-xs transition-colors border border-[#D4AF37]/30 flex items-center justify-center gap-1.5 min-h-[42px]"
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
                        ? 'bg-[#D4AF37] hover:bg-[#c49f27] text-black shadow-[#D4AF37]/20 hover:scale-[1.01]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                    <span>Queue Scheduled Post</span>
                  </button>
                ) : hasPostedToday && allowDraftingAfterPost ? (
                  <button
                    type="button"
                    onClick={handleExplicitSaveDraft}
                    className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Draft for Tomorrow</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px] ${
                      content.trim()
                        ? 'bg-[#D4AF37] hover:bg-[#c49f27] text-black shadow-[#D4AF37]/20 hover:scale-[1.01]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Post Daily Proof</span>
                  </button>
                )}
              </div>
            </form>
          )}
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
