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
} from 'lucide-react';
import { User, Post, Community } from '../types';
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
  initialContent?: string;
  initialImageUrl?: string;
  initialTags?: string[];
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
  onSubmitPost,
  onViewMyPost,
  initialContent,
  initialImageUrl,
  initialTags,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Building']);
  const [showPresets, setShowPresets] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [isCollageGenerated, setIsCollageGenerated] = useState(false);
  const [isCollageStudioOpen, setIsCollageStudioOpen] = useState(false);
  const [allowDraftingAfterPost, setAllowDraftingAfterPost] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef(false);

  const today = getTodayDateString();
  const hasPostedToday = DailyStorageService.hasUserPostedMainToday(currentUser.id);
  const todayPost = DailyStorageService.getTodayPostForUser(currentUser.id);

  // Initialize form state once on open
  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setAllowDraftingAfterPost(false);

        if (initialContent !== undefined || initialImageUrl !== undefined) {
          setContent(initialContent || '');
          setImageUrl(initialImageUrl || '');
          if (initialTags && initialTags.length > 0) {
            setSelectedTags(initialTags);
          } else {
            setSelectedTags(['Building']);
          }
          setDraftRestored(false);
        } else {
          // Check local draft
          const savedDraft = DailyStorageService.getPostDraft(currentUser.id);
          if (savedDraft && (savedDraft.content?.trim() || savedDraft.imageUrl?.trim())) {
            setContent(savedDraft.content || '');
            setImageUrl(savedDraft.imageUrl || '');
            if (savedDraft.tags && savedDraft.tags.length > 0) {
              setSelectedTags(savedDraft.tags);
            } else {
              setSelectedTags(['Building']);
            }
            setDraftRestored(true);
          } else {
            setContent('');
            setImageUrl('');
            setSelectedTags(['Building']);
            setDraftRestored(false);
          }
        }
      }
    } else {
      hasInitializedRef.current = false;
      setDraftSavedToast(false);
      setIsCollageGenerated(false);
    }
  }, [isOpen, currentUser.id, initialContent, initialImageUrl, initialTags]);

  // Debounced auto-save draft to local storage so drafts persist continuously
  useEffect(() => {
    if (!isOpen || !hasInitializedRef.current) return;

    const timer = setTimeout(() => {
      if (content.trim() || imageUrl.trim()) {
        DailyStorageService.savePostDraft(currentUser.id, {
          content,
          imageUrl,
          tags: selectedTags,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen, content, imageUrl, selectedTags, currentUser.id]);

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
    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setDraftRestored(false);
    setIsCollageGenerated(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSafeClose = () => {
    if (content.trim() || imageUrl.trim()) {
      DailyStorageService.savePostDraft(currentUser.id, {
        content,
        imageUrl,
        tags: selectedTags,
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

    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setShowPresets(false);
    setDraftRestored(false);
    setIsCollageGenerated(false);
    onClose();
  };

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
                  <span className="text-[10px] text-white/40">{content.length} chars</span>
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

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition-colors border border-white/10 flex items-center justify-center gap-1.5"
                  title="Clear inputs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                {hasPostedToday && allowDraftingAfterPost ? (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      DailyStorageService.savePostDraft(currentUser.id, {
                        content,
                        imageUrl,
                        tags: selectedTags,
                      });
                      setDraftSavedToast(true);
                      setTimeout(() => setDraftSavedToast(false), 2000);
                    }}
                    className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{draftSavedToast ? 'Draft Saved ✓' : 'Save Draft for Tomorrow'}</span>
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
